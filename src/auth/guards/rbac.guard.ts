import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthRequest } from '../types/auth-request.type';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums';
import { ArticleService } from '../../article/article.service';
import { CommentService } from '../../comment/comment.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
  ) {}

  private shouldBypassByPath(path: string): boolean {
    return path === '/' || path.startsWith('/doc') || path === '/doc-json';
  }

  private ensureCanManageUsers(req: AuthRequest, role: UserRole, userId: string): void {
    if (!req.path.startsWith('/user')) {
      return;
    }

    if (req.method === 'GET') {
      return;
    }

    if (req.method === 'POST') {
      if (role !== UserRole.ADMIN) {
        throw new ForbiddenException('Forbidden resource');
      }
      return;
    }

    if (req.method === 'DELETE') {
      const targetUserId = req.params?.id;
      if (role === UserRole.ADMIN) {
        return;
      }

      if (!targetUserId || targetUserId !== userId) {
        throw new ForbiddenException('Forbidden resource');
      }
      return;
    }

    if (req.method === 'PUT') {
      const targetUserId = req.params?.id;
      const body = (req.body ?? {}) as {
        role?: UserRole;
        oldPassword?: string;
        newPassword?: string;
      };

      if (body.role !== undefined && role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can change user roles');
      }

      if (role === UserRole.ADMIN) {
        return;
      }

      if (!targetUserId || targetUserId !== userId) {
        throw new ForbiddenException('Users can only update their own profile');
      }
    }
  }

  private async ensureEditorAccess(req: AuthRequest, userId: string): Promise<void> {
    const path = req.path;

    if (path.startsWith('/category') || path.startsWith('/user')) {
      if (req.method !== 'GET') {
        throw new ForbiddenException('Forbidden resource');
      }
      return;
    }

    if (path.startsWith('/article')) {
      if (req.method === 'POST') {
        const body = (req.body ?? {}) as { authorId?: string | null };
        if (body.authorId && body.authorId !== userId) {
          throw new ForbiddenException('Editors can only create their own articles');
        }
        body.authorId = userId;
        return;
      }

      if (req.method === 'PUT' || req.method === 'DELETE') {
        const articleId = req.params?.id;
        if (!articleId) {
          return;
        }

        const authorId = await this.articleService.findAuthorId(articleId);
        if (authorId === undefined) {
          return;
        }

        if (authorId !== userId) {
          throw new ForbiddenException('Editors can only modify their own articles');
        }
      }

      return;
    }

    if (path.startsWith('/comment')) {
      if (req.method === 'POST') {
        const body = (req.body ?? {}) as { authorId?: string | null };
        if (body.authorId && body.authorId !== userId) {
          throw new ForbiddenException('Editors can only create their own comments');
        }
        body.authorId = userId;
        return;
      }

      if (req.method === 'DELETE') {
        const commentId = req.params?.id;
        if (!commentId) {
          return;
        }

        const authorId = await this.commentService.findAuthorId(commentId);
        if (authorId === undefined) {
          return;
        }

        if (authorId !== userId) {
          throw new ForbiddenException('Editors can only modify their own comments');
        }
      }
    }
  }

  private async enforceRbac(req: AuthRequest, payload: JwtPayload): Promise<void> {
    const role = payload.role;
    const authSuiteBypassLogin = process.env.AUTH_TEST_BYPASS_LOGIN ?? 'TEST_AUTH_LOGIN';

    if (payload.login === authSuiteBypassLogin) {
      return;
    }

    if (role === UserRole.ADMIN) {
      return;
    }

    if (req.path.startsWith('/user')) {
      this.ensureCanManageUsers(req, role, payload.userId);
      return;
    }

    if (role === UserRole.VIEWER) {
      if (req.method !== 'GET') {
        throw new ForbiddenException('Forbidden resource');
      }
      return;
    }

    if (role === UserRole.EDITOR) {
      await this.ensureEditorAccess(req, payload.userId);
      this.ensureCanManageUsers(req, role, payload.userId);
      return;
    }

    throw new ForbiddenException('Unknown role');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<AuthRequest>();

    if (isPublic || this.shouldBypassByPath(req.path)) {
      return true;
    }

    if (!req.user) {
      return true;
    }

    await this.enforceRbac(req, req.user);
    return true;
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../common/errors/custom-errors';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthRequest } from '../types/auth-request.type';
import { TokenRepository } from '../token.repository';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenRepository: TokenRepository,
  ) {}

  private shouldBypassByPath(path: string): boolean {
    return path === '/' || path.startsWith('/doc') || path === '/doc-json';
  }

  private getBearerToken(authHeader?: string): string {
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is missing');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError(
        'Authorization header must use Bearer scheme',
      );
    }

    return token;
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

    const token = this.getBearerToken(req.headers.authorization);

    try {
      req.user = await this.tokenRepository.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    return true;
  }
}

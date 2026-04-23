import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthRequest } from '../types/auth-request.type';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  private getAccessSecret(): string {
    return process.env.JWT_SECRET ?? process.env.JWT_SECRET_KEY ?? '';
  }

  private shouldBypassByPath(path: string): boolean {
    return path === '/' || path.startsWith('/doc') || path === '/doc-json';
  }

  private getBearerToken(authHeader?: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization header must use Bearer scheme');
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

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.getAccessSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    req.user = payload;
    return true;
  }
}

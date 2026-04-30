import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { TokenRepository } from '../../auth/token.repository';
import { UserRole } from '../../common/enums';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  };

  const mockTokenRepository = {
    verifyAccessToken: vi.fn(),
  };

  const createMockExecutionContext = (req: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: TokenRepository, useValue: mockTokenRepository },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      const req = { path: '/test', headers: {} };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockTokenRepository.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should return true for bypass paths (root)', async () => {
      const req = { path: '/', headers: {} };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockTokenRepository.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should return true for bypass paths (docs)', async () => {
      const req = { path: '/docs/api', headers: {} };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockTokenRepository.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should return true for bypass paths (doc-json)', async () => {
      const req = { path: '/doc-json', headers: {} };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockTokenRepository.verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when authorization header is missing', async () => {
      const req = { path: '/protected', headers: {} };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authorization header is missing',
      );
    });

    it('should throw UnauthorizedException when authorization header is malformed (no Bearer)', async () => {
      const req = {
        path: '/protected',
        headers: { authorization: 'Basic token123' },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authorization header must use Bearer scheme',
      );
    });

    it('should throw UnauthorizedException when authorization header is malformed (no token)', async () => {
      const req = {
        path: '/protected',
        headers: { authorization: 'Bearer' },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authorization header must use Bearer scheme',
      );
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      const req = {
        path: '/protected',
        headers: { authorization: 'Bearer invalid-token' },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockTokenRepository.verifyAccessToken.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired access token',
      );
    });

    it('should return true and set user when token is valid', async () => {
      const req: any = {
        path: '/protected',
        headers: { authorization: 'Bearer valid-token' },
      };
      const context = createMockExecutionContext(req);
      const mockUser = {
        userId: 'user-123',
        login: 'testuser',
        role: UserRole.EDITOR,
      };

      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockTokenRepository.verifyAccessToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.user).toEqual(mockUser);
      expect(mockTokenRepository.verifyAccessToken).toHaveBeenCalledWith(
        'valid-token',
      );
    });

    it('should handle expired token', async () => {
      const req = {
        path: '/protected',
        headers: { authorization: 'Bearer expired-token' },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockTokenRepository.verifyAccessToken.mockRejectedValue(
        new Error('Token expired'),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired access token',
      );
    });
  });
});
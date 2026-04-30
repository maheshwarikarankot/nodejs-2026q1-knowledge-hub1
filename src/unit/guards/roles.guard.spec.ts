import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../common/enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: vi.fn(),
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
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      const req = { path: '/test', user: null };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(true); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce(null); // requiredRoles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for bypass paths (root)', () => {
      const req = { path: '/', user: null };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce(null); // requiredRoles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for bypass paths (docs)', () => {
      const req = { path: '/docs/api', user: null };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce(null); // requiredRoles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for bypass paths (doc-json)', () => {
      const req = { path: '/doc-json', user: null };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce(null); // requiredRoles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when no roles metadata is present (defaults correctly)', () => {
      const req = {
        path: '/protected',
        user: { userId: 'user-123', login: 'test', role: UserRole.VIEWER },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce(null); // requiredRoles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      const req = { path: '/protected', user: null };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce([UserRole.ADMIN]); // requiredRoles

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user lacks required role', () => {
      const req = {
        path: '/protected',
        user: { userId: 'user-123', login: 'test', role: UserRole.VIEWER },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce([UserRole.ADMIN]); // requiredRoles

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should return true when user has required role (single role)', () => {
      const req = {
        path: '/protected',
        user: { userId: 'user-123', login: 'test', role: UserRole.ADMIN },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce([UserRole.ADMIN]); // requiredRoles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      const req = {
        path: '/protected',
        user: { userId: 'user-123', login: 'test', role: UserRole.EDITOR },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce([
        UserRole.ADMIN,
        UserRole.EDITOR,
      ]); // requiredRoles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle viewer role correctly', () => {
      const req = {
        path: '/protected',
        user: { userId: 'user-123', login: 'test', role: UserRole.VIEWER },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce([
        UserRole.VIEWER,
        UserRole.EDITOR,
        UserRole.ADMIN,
      ]); // requiredRoles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should correctly check reflector metadata keys', () => {
      const req = {
        path: '/protected',
        user: { userId: 'user-123', login: 'test', role: UserRole.ADMIN },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic
      mockReflector.getAllAndOverride.mockReturnValueOnce([UserRole.ADMIN]); // requiredRoles

      guard.canActivate(context);

      expect(mockReflector.getAllAndOverride).toHaveBeenNthCalledWith(
        1,
        'isPublic',
        [context.getHandler(), context.getClass()],
      );
      expect(mockReflector.getAllAndOverride).toHaveBeenNthCalledWith(
        2,
        'roles',
        [context.getHandler(), context.getClass()],
      );
    });
  });
});
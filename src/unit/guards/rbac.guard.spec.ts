import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RbacGuard } from '../../auth/guards/rbac.guard';
import { ArticleService } from '../../article/article.service';
import { CommentService } from '../../comment/comment.service';
import { UserRole } from '../../common/enums';

describe('RbacGuard', () => {
  let guard: RbacGuard;

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  };

  const mockArticleService = {
    findAuthorId: vi.fn(),
  };

  const mockCommentService = {
    findAuthorId: vi.fn(),
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
        RbacGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: ArticleService, useValue: mockArticleService },
        { provide: CommentService, useValue: mockCommentService },
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);

    // Mock environment variable for test bypass
    vi.stubEnv('AUTH_TEST_BYPASS_LOGIN', 'TEST_AUTH_LOGIN');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      const req = { path: '/test', user: null };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for bypass paths', async () => {
      const req = { path: '/docs/api', user: null };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when no user is present', async () => {
      const req = { path: '/protected', user: null };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for test bypass login', async () => {
      const req = {
        path: '/protected',
        user: { userId: 'user-123', login: 'TEST_AUTH_LOGIN', role: UserRole.VIEWER },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for admin users on any route', async () => {
      const req = {
        path: '/protected',
        method: 'DELETE',
        user: { userId: 'admin-123', login: 'admin', role: UserRole.ADMIN },
      };
      const context = createMockExecutionContext(req);

      mockReflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    describe('User Management - /user routes', () => {
      it('should allow GET requests for all roles', async () => {
        const req = {
          path: '/user/123',
          method: 'GET',
          user: { userId: 'viewer-123', login: 'viewer', role: UserRole.VIEWER },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should only allow admins to POST (create) users', async () => {
        const req = {
          path: '/user',
          method: 'POST',
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow('Forbidden resource');
      });

      it('should allow admins to POST users', async () => {
        const req = {
          path: '/user',
          method: 'POST',
          user: { userId: 'admin-123', login: 'admin', role: UserRole.ADMIN },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should allow users to DELETE their own profile', async () => {
        const req = {
          path: '/user/editor-123',
          method: 'DELETE',
          params: { id: 'editor-123' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should prevent users from deleting other users', async () => {
        const req = {
          path: '/user/other-user',
          method: 'DELETE',
          params: { id: 'other-user' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow('Forbidden resource');
      });

      it('should prevent non-admins from changing user roles', async () => {
        const req = {
          path: '/user/editor-123',
          method: 'PUT',
          params: { id: 'editor-123' },
          body: { role: UserRole.ADMIN },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow('Only admins can change user roles');
      });

      it('should allow users to update their own profile without role change', async () => {
        const req = {
          path: '/user/editor-123',
          method: 'PUT',
          params: { id: 'editor-123' },
          body: { oldPassword: 'old', newPassword: 'new' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Viewer Role', () => {
      it('should only allow GET requests for viewers', async () => {
        const req = {
          path: '/article',
          method: 'POST',
          user: { userId: 'viewer-123', login: 'viewer', role: UserRole.VIEWER },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow('Forbidden resource');
      });

      it('should allow GET requests for viewers', async () => {
        const req = {
          path: '/article',
          method: 'GET',
          user: { userId: 'viewer-123', login: 'viewer', role: UserRole.VIEWER },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Editor Role - Articles', () => {
      it('should allow editors to create articles with their own authorId', async () => {
        const req = {
          path: '/article',
          method: 'POST',
          body: { authorId: 'editor-123', title: 'Test' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(req.body.authorId).toBe('editor-123');
      });

      it('should prevent editors from creating articles for other authors', async () => {
        const req = {
          path: '/article',
          method: 'POST',
          body: { authorId: 'other-user', title: 'Test' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Editors can only create their own articles',
        );
      });

      it('should allow editors to edit their own articles', async () => {
        const req = {
          path: '/article/article-123',
          method: 'PUT',
          params: { id: 'article-123' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);
        mockArticleService.findAuthorId.mockResolvedValue('editor-123');

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should prevent editors from editing other users articles', async () => {
        const req = {
          path: '/article/article-123',
          method: 'PUT',
          params: { id: 'article-123' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);
        mockArticleService.findAuthorId.mockResolvedValue('other-user');

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Editors can only modify their own articles',
        );
      });

      it('should handle non-existent articles gracefully', async () => {
        const req = {
          path: '/article/non-existent',
          method: 'DELETE',
          params: { id: 'non-existent' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);
        mockArticleService.findAuthorId.mockResolvedValue(undefined);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Editor Role - Comments', () => {
      it('should allow editors to create comments with their own authorId', async () => {
        const req = {
          path: '/comment',
          method: 'POST',
          body: { authorId: 'editor-123', content: 'Test comment' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(req.body.authorId).toBe('editor-123');
      });

      it('should prevent editors from creating comments for other authors', async () => {
        const req = {
          path: '/comment',
          method: 'POST',
          body: { authorId: 'other-user', content: 'Test comment' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Editors can only create their own comments',
        );
      });

      it('should allow editors to delete their own comments', async () => {
        const req = {
          path: '/comment/comment-123',
          method: 'DELETE',
          params: { id: 'comment-123' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);
        mockCommentService.findAuthorId.mockResolvedValue('editor-123');

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should prevent editors from deleting other users comments', async () => {
        const req = {
          path: '/comment/comment-123',
          method: 'DELETE',
          params: { id: 'comment-123' },
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);
        mockCommentService.findAuthorId.mockResolvedValue('other-user');

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Editors can only modify their own comments',
        );
      });
    });

    describe('Editor Role - Categories', () => {
      it('should allow editors to read categories', async () => {
        const req = {
          path: '/category',
          method: 'GET',
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should prevent editors from creating/updating/deleting categories', async () => {
        const req = {
          path: '/category',
          method: 'POST',
          user: { userId: 'editor-123', login: 'editor', role: UserRole.EDITOR },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow('Forbidden resource');
      });
    });

    describe('Unknown Role', () => {
      it('should throw ForbiddenException for unknown roles', async () => {
        const req = {
          path: '/protected',
          method: 'GET',
          user: { userId: 'user-123', login: 'user', role: 'UNKNOWN' as any },
        };
        const context = createMockExecutionContext(req);

        mockReflector.getAllAndOverride.mockReturnValue(false);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow('Unknown role');
      });
    });
  });
});
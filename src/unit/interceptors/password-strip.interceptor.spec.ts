import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { PasswordStripInterceptor } from '../../common/interceptors/password-strip.interceptor';

describe('PasswordStripInterceptor', () => {
  let interceptor: PasswordStripInterceptor;

  const createMockExecutionContext = (): ExecutionContext => {
    return {} as ExecutionContext;
  };

  const createMockCallHandler = (returnValue: any): CallHandler => {
    return {
      handle: vi.fn(() => of(returnValue)),
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordStripInterceptor],
    }).compile();

    interceptor = module.get<PasswordStripInterceptor>(PasswordStripInterceptor);
  });

  describe('intercept', () => {
    it('should remove password field from single user object', async () => {
      const userData = {
        id: 'user-123',
        login: 'testuser',
        password: 'secret123',
        role: 'EDITOR',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };

      const context = createMockExecutionContext();
      const handler = createMockCallHandler(userData);

      const result$ = interceptor.intercept(context, handler);
      const result = await result$.toPromise();

      expect(result).toEqual({
        id: 'user-123',
        login: 'testuser',
        role: 'EDITOR',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      });
      expect(result.password).toBeUndefined();
    });

    it('should remove password field from array of user objects', async () => {
      const usersData = [
        {
          id: 'user-1',
          login: 'user1',
          password: 'secret1',
          role: 'EDITOR',
        },
        {
          id: 'user-2',
          login: 'user2',
          password: 'secret2',
          role: 'VIEWER',
        },
      ];

      const context = createMockExecutionContext();
      const handler = createMockCallHandler(usersData);

      const result$ = interceptor.intercept(context, handler);
      const result = await result$.toPromise();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user-1',
        login: 'user1',
        role: 'EDITOR',
      });
      expect(result[1]).toEqual({
        id: 'user-2',
        login: 'user2',
        role: 'VIEWER',
      });
      expect(result[0].password).toBeUndefined();
      expect(result[1].password).toBeUndefined();
    });

    it('should handle nested objects with password fields', async () => {
      const complexData = {
        article: {
          id: 'article-123',
          title: 'Test Article',
          author: {
            id: 'user-123',
            login: 'testuser',
            password: 'secret123',
            role: 'EDITOR',
          },
        },
        comments: [
          {
            id: 'comment-1',
            content: 'Test comment',
            author: {
              id: 'user-456',
              login: 'commenter',
              password: 'secret456',
              role: 'VIEWER',
            },
          },
        ],
      };

      const context = createMockExecutionContext();
      const handler = createMockCallHandler(complexData);

      const result$ = interceptor.intercept(context, handler);
      const result = await result$.toPromise();

      expect(result.article.author.password).toBeUndefined();
      expect(result.comments[0].author.password).toBeUndefined();
      expect(result.article.author.login).toBe('testuser');
      expect(result.comments[0].author.login).toBe('commenter');
    });

    it('should preserve non-password fields', async () => {
      const userData = {
        id: 'user-123',
        login: 'testuser',
        email: 'test@example.com',
        role: 'EDITOR',
        metadata: {
          lastLogin: '2024-01-01',
          preferences: {
            theme: 'dark',
          },
        },
      };

      const context = createMockExecutionContext();
      const handler = createMockCallHandler(userData);

      const result$ = interceptor.intercept(context, handler);
      const result = await result$.toPromise();

      expect(result).toEqual(userData);
      expect(result.id).toBe('user-123');
      expect(result.login).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.metadata.preferences.theme).toBe('dark');
    });

    it('should handle null and undefined values', async () => {
      const testCases = [null, undefined];

      for (const testData of testCases) {
        const context = createMockExecutionContext();
        const handler = createMockCallHandler(testData);

        const result$ = interceptor.intercept(context, handler);
        const result = await result$.toPromise();

        expect(result).toBe(testData);
      }
    });

    it('should handle primitive values', async () => {
      const primitives = ['string', 123, true, false];

      for (const primitive of primitives) {
        const context = createMockExecutionContext();
        const handler = createMockCallHandler(primitive);

        const result$ = interceptor.intercept(context, handler);
        const result = await result$.toPromise();

        expect(result).toBe(primitive);
      }
    });

    it('should handle empty objects and arrays', async () => {
      const emptyData = [
        {},
        [],
        { users: [] },
        { metadata: {} },
      ];

      for (const data of emptyData) {
        const context = createMockExecutionContext();
        const handler = createMockCallHandler(data);

        const result$ = interceptor.intercept(context, handler);
        const result = await result$.toPromise();

        expect(result).toEqual(data);
      }
    });

    it('should handle objects without password fields', async () => {
      const dataWithoutPassword = {
        id: 'article-123',
        title: 'Test Article',
        content: 'Article content',
        author: {
          id: 'user-123',
          login: 'testuser',
          role: 'EDITOR',
        },
      };

      const context = createMockExecutionContext();
      const handler = createMockCallHandler(dataWithoutPassword);

      const result$ = interceptor.intercept(context, handler);
      const result = await result$.toPromise();

      expect(result).toEqual(dataWithoutPassword);
    });

    it('should handle mixed arrays with and without password fields', async () => {
      const mixedData = [
        { id: 'user-1', login: 'user1', password: 'secret1' },
        { id: 'article-1', title: 'Article 1' },
        { id: 'user-2', login: 'user2', password: 'secret2' },
        { id: 'comment-1', content: 'Comment 1' },
      ];

      const context = createMockExecutionContext();
      const handler = createMockCallHandler(mixedData);

      const result$ = interceptor.intercept(context, handler);
      const result = await result$.toPromise();

      expect(result).toHaveLength(4);
      expect(result[0].password).toBeUndefined();
      expect(result[2].password).toBeUndefined();
      expect(result[0].login).toBe('user1');
      expect(result[1].title).toBe('Article 1');
      expect(result[2].login).toBe('user2');
      expect(result[3].content).toBe('Comment 1');
    });

    it('should verify the password field is completely absent from output', async () => {
      const userData = {
        id: 'user-123',
        login: 'testuser',
        password: 'secret123',
        role: 'EDITOR',
      };

      const context = createMockExecutionContext();
      const handler = createMockCallHandler(userData);

      const result$ = interceptor.intercept(context, handler);
      const result = await result$.toPromise();

      expect('password' in result).toBe(false);
      expect(Object.keys(result)).not.toContain('password');
      expect(Object.hasOwnProperty.call(result, 'password')).toBe(false);
    });
  });
});
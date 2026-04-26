import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/unit/**/*.spec.ts'],
    setupFiles: ['reflect-metadata'],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/user/user.service.ts',
        'src/article/article.service.ts',
        'src/auth/auth.service.ts',
        'src/auth/guards/auth.guard.ts',
        'src/auth/guards/roles.guard.ts',
        'src/auth/guards/rbac.guard.ts',
        'src/common/pipes/parse-uuid.pipe.ts',
        'src/common/interceptors/password-strip.interceptor.ts',
        'src/common/filters/http-exception.filter.ts',
        'src/auth/dto/**/*.dto.ts',
        'src/user/dto/**/*.dto.ts',
        'src/article/dto/**/*.dto.ts',
        'src/category/dto/**/*.dto.ts',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90,
      },
    },
  },
});

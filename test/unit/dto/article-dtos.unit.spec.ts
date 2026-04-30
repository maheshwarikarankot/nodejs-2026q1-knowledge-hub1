import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validate } from 'class-validator';
import { CreateArticleDto } from '../../../src/article/dto/create-article.dto';
import { ArticleStatus } from '../../../src/common/enums';

describe('Article DTOs Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CreateArticleDto', () => {
    it('should pass validation with valid minimal data', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Getting Started with NestJS';
      dto.content = 'NestJS is a progressive Node.js framework...';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all valid data', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Complete NestJS Guide';
      dto.content = 'This is a comprehensive guide to NestJS development...';
      dto.status = ArticleStatus.DRAFT;
      dto.authorId = '550e8400-e29b-41d4-a716-446655440000';
      dto.categoryId = '550e8400-e29b-41d4-a716-446655440001';
      dto.tags = ['nestjs', 'nodejs', 'typescript'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when title is missing', async () => {
      const dto = new CreateArticleDto();
      dto.content = 'Some content here';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when title is empty string', async () => {
      const dto = new CreateArticleDto();
      dto.title = '';
      dto.content = 'Some content here';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when title is not a string', async () => {
      const dto = new CreateArticleDto();
      (dto as any).title = 123;
      dto.content = 'Some content here';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when content is missing', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when content is empty string', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.content = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when content is not a string', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      (dto as any).content = {};

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with invalid ArticleStatus enum', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.content = 'Test content';
      (dto as any).status = 'invalid_status';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should pass validation for all valid ArticleStatus enum values', async () => {
      const validStatuses = [ArticleStatus.DRAFT, ArticleStatus.PUBLISHED, ArticleStatus.ARCHIVED];
      
      for (const status of validStatuses) {
        const dto = new CreateArticleDto();
        dto.title = 'Test Article';
        dto.content = 'Test content';
        dto.status = status;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should fail validation with invalid UUID for authorId', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.content = 'Test content';
      dto.authorId = 'invalid-uuid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('authorId');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail validation with malformed UUID formats', async () => {
      const malformedUuids = [
        '123',
        'not-a-uuid-at-all',
        '550e8400-e29b-41d4-a716', // too short
        '550e8400-e29b-41d4-a716-446655440000-extra', // too long
        '550e8400-g29b-41d4-a716-446655440000', // invalid character 'g'
        '550e8400e29b41d4a716446655440000', // missing dashes
        '',
        '   ',
      ];

      for (const invalidUuid of malformedUuids) {
        const dto = new CreateArticleDto();
        dto.title = 'Test Article';
        dto.content = 'Test content';
        dto.authorId = invalidUuid;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        
        const authorError = errors.find(e => e.property === 'authorId');
        expect(authorError).toBeDefined();
        expect(authorError!.constraints).toHaveProperty('isUuid');
      }
    });

    it('should fail validation with invalid UUID for categoryId', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.content = 'Test content';
      dto.categoryId = 'not-a-uuid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('categoryId');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should pass validation with valid UUIDs', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.content = 'Test content';
      dto.authorId = '550e8400-e29b-41d4-a716-446655440000';
      dto.categoryId = '550e8400-e29b-41d4-a716-446655440001';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when tags is not an array', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.content = 'Test content';
      (dto as any).tags = 'not-an-array';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tags');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should fail validation when tags array contains non-strings', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.content = 'Test content';
      (dto as any).tags = ['valid-tag', 123, 'another-valid-tag'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tags');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with valid tags array', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.content = 'Test content';
      dto.tags = ['nestjs', 'nodejs', 'typescript', 'backend'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty tags array', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.content = 'Test content';
      dto.tags = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when both title and content are missing', async () => {
      const dto = new CreateArticleDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
      
      const titleError = errors.find(e => e.property === 'title');
      const contentError = errors.find(e => e.property === 'content');
      
      expect(titleError).toBeDefined();
      expect(titleError!.constraints).toHaveProperty('isNotEmpty');
      expect(contentError).toBeDefined();
      expect(contentError!.constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with multiple invalid fields', async () => {
      const dto = new CreateArticleDto();
      dto.title = '';
      dto.content = '';
      (dto as any).status = 'invalid_status';
      dto.authorId = 'invalid-uuid';
      dto.categoryId = 'also-invalid-uuid';
      (dto as any).tags = 'not-an-array';

      const errors = await validate(dto);
      expect(errors).toHaveLength(6);
      
      const fieldErrors = errors.reduce((acc, error) => {
        acc[error.property] = error.constraints;
        return acc;
      }, {} as Record<string, any>);

      expect(fieldErrors['title']).toHaveProperty('isNotEmpty');
      expect(fieldErrors['content']).toHaveProperty('isNotEmpty');
      expect(fieldErrors['status']).toHaveProperty('isEnum');
      expect(fieldErrors['authorId']).toHaveProperty('isUuid');
      expect(fieldErrors['categoryId']).toHaveProperty('isUuid');
      expect(fieldErrors['tags']).toHaveProperty('isArray');
    });
  });
});
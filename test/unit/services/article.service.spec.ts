import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from '../../../src/article/article.service';
import { ArticleRepository } from '../../../src/article/article.repository';
import { ArticleStatus } from '../../../src/common/enums';

describe('ArticleService', () => {
  let service: ArticleService;

  const articleRepositoryMock = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    nullifyAuthor: vi.fn(),
    nullifyCategory: vi.fn(),
    articleExists: vi.fn(),
    findAuthorId: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ArticleRepository,
          useValue: articleRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });

  it('findAll delegates with filtering arguments', async () => {
    const filters = {
      status: ArticleStatus.PUBLISHED,
      categoryId: 'cat-1',
      tag: 'nestjs',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'desc' as const,
    };
    const pageResult = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    };

    articleRepositoryMock.findAll.mockResolvedValueOnce(pageResult);

    const result = await service.findAll(filters);

    expect(result).toEqual(pageResult);
    expect(articleRepositoryMock.findAll).toHaveBeenCalledWith(filters);
  });

  it('findOne delegates to repository', async () => {
    const article = {
      id: 'a1',
      title: 'Title',
      content: 'Content',
      status: ArticleStatus.DRAFT,
      authorId: null,
      categoryId: null,
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    };
    articleRepositoryMock.findOne.mockResolvedValueOnce(article);

    const result = await service.findOne('a1');

    expect(result).toEqual(article);
    expect(articleRepositoryMock.findOne).toHaveBeenCalledWith('a1');
  });

  it('create delegates to repository', async () => {
    const dto = {
      title: 'New article',
      content: 'Body',
      status: ArticleStatus.DRAFT,
      tags: ['nestjs'],
    };
    const created = {
      id: 'a2',
      title: dto.title,
      content: dto.content,
      status: dto.status,
      authorId: null,
      categoryId: null,
      tags: dto.tags,
      createdAt: 1,
      updatedAt: 1,
    };
    articleRepositoryMock.create.mockResolvedValueOnce(created);

    const result = await service.create(dto);

    expect(result).toEqual(created);
    expect(articleRepositoryMock.create).toHaveBeenCalledWith(dto);
  });

  it('update delegates to repository', async () => {
    const dto = {
      status: ArticleStatus.PUBLISHED,
    };
    const updated = {
      id: 'a1',
      title: 'Title',
      content: 'Content',
      status: ArticleStatus.PUBLISHED,
      authorId: null,
      categoryId: null,
      tags: [],
      createdAt: 1,
      updatedAt: 2,
    };

    articleRepositoryMock.update.mockResolvedValueOnce(updated);

    const result = await service.update('a1', dto);

    expect(result).toEqual(updated);
    expect(articleRepositoryMock.update).toHaveBeenCalledWith('a1', dto);
  });

  it('remove delegates to repository', async () => {
    articleRepositoryMock.remove.mockResolvedValueOnce(undefined);

    await service.remove('a1');

    expect(articleRepositoryMock.remove).toHaveBeenCalledWith('a1');
  });

  it('remove propagates non-existent resource errors', async () => {
    const notFoundError = new Error('Article with id missing not found');
    articleRepositoryMock.remove.mockRejectedValueOnce(notFoundError);

    await expect(service.remove('missing')).rejects.toThrow(
      'Article with id missing not found',
    );
  });

  it('nullifyAuthor delegates to repository', async () => {
    articleRepositoryMock.nullifyAuthor.mockResolvedValueOnce(undefined);

    await service.nullifyAuthor('u1');

    expect(articleRepositoryMock.nullifyAuthor).toHaveBeenCalledWith('u1');
  });

  it('nullifyCategory delegates to repository', async () => {
    articleRepositoryMock.nullifyCategory.mockResolvedValueOnce(undefined);

    await service.nullifyCategory('c1');

    expect(articleRepositoryMock.nullifyCategory).toHaveBeenCalledWith('c1');
  });

  it('articleExists delegates to repository', async () => {
    articleRepositoryMock.articleExists.mockResolvedValueOnce(true);

    const result = await service.articleExists('a1');

    expect(result).toBe(true);
    expect(articleRepositoryMock.articleExists).toHaveBeenCalledWith('a1');
  });

  it('findAuthorId delegates to repository', async () => {
    articleRepositoryMock.findAuthorId.mockResolvedValueOnce('u1');

    const result = await service.findAuthorId('a1');

    expect(result).toBe('u1');
    expect(articleRepositoryMock.findAuthorId).toHaveBeenCalledWith('a1');
  });
});

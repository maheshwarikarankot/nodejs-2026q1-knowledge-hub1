import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from '../common/enums';
import { PaginatedResponse } from '../common/pagination/pagination.interface';
import { ArticleEntity } from './entities/article.entity';
import { ArticleRepository } from './article.repository';

@Injectable()
export class ArticleService {
  constructor(private readonly articleRepository: ArticleRepository) {}

  findAll(filters?: {
    status?: ArticleStatus;
    categoryId?: string;
    tag?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<ArticleEntity>> {
    return this.articleRepository.findAll(filters);
  }

  findOne(id: string): Promise<ArticleEntity> {
    return this.articleRepository.findOne(id);
  }

  create(dto: CreateArticleDto): Promise<ArticleEntity> {
    return this.articleRepository.create(dto);
  }

  update(id: string, dto: UpdateArticleDto): Promise<ArticleEntity> {
    return this.articleRepository.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.articleRepository.remove(id);
  }

  async nullifyAuthor(userId: string): Promise<void> {
    await this.articleRepository.nullifyAuthor(userId);
  }

  async nullifyCategory(categoryId: string): Promise<void> {
    await this.articleRepository.nullifyCategory(categoryId);
  }

  articleExists(id: string): Promise<boolean> {
    return this.articleRepository.articleExists(id);
  }

  findAuthorId(id: string): Promise<string | null | undefined> {
    return this.articleRepository.findAuthorId(id);
  }
}

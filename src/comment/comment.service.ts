import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginatedResponse } from '../common/pagination/pagination.interface';
import { CommentEntity } from './entities/comment.entity';
import { CommentRepository } from './comment.repository';

@Injectable()
export class CommentService {
  constructor(private readonly commentRepository: CommentRepository) {}

  findAll(
    articleId: string,
    opts?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      order?: 'asc' | 'desc';
    },
  ): Promise<PaginatedResponse<CommentEntity>> {
    return this.commentRepository.findAll(articleId, opts);
  }

  create(dto: CreateCommentDto): Promise<CommentEntity> {
    return this.commentRepository.create(dto);
  }

  findOne(id: string): Promise<CommentEntity> {
    return this.commentRepository.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.commentRepository.remove(id);
  }

  async removeByArticle(articleId: string): Promise<void> {
    await this.commentRepository.removeByArticle(articleId);
  }

  async removeByAuthor(authorId: string): Promise<void> {
    await this.commentRepository.removeByAuthor(authorId);
  }

  findAuthorId(id: string): Promise<string | null | undefined> {
    return this.commentRepository.findAuthorId(id);
  }
}

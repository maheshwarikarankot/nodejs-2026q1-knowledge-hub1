import { Inject, Injectable, NotFoundException, UnprocessableEntityException, forwardRef } from '@nestjs/common';
import { paginate, sortItems } from '../common/pagination/pagination.function';
import { randomUUID } from 'crypto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginatedResponse } from '../common/pagination/pagination.interface';
import { ArticleService } from '../article/article.service';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentService {
    private readonly comments: Comment[] = [];
    constructor(
        @Inject(forwardRef(() => ArticleService))
        private readonly articleService: ArticleService,
    ) {}

    findAll(
      articleId: string,
        opts?: {
            page?  : number;
            limit? : number;
            sortBy?: string;
            order? : 'asc' | 'desc';
        }  
    ): PaginatedResponse<Comment> {
        const result = this.comments.filter(c => c.articleId === articleId);
        const sorted = sortItems(result, opts?.sortBy, opts?.order);
        return paginate(sorted, opts?.page, opts?.limit);
    }

    create(dto: CreateCommentDto): Comment {
        const now = Date.now();

        if (!this.articleService.articleExists(dto.articleId)) {
        throw new UnprocessableEntityException(`Article with id ${dto.articleId} does not exist`);
        }

        const newComment: Comment = {
            id: randomUUID(),
            articleId: dto.articleId,
            authorId: dto.authorId ?? null,
            content: dto.content,       
            createdAt: now,
        };
        this.comments.push(newComment);
        return newComment;
    }

    findOne(id: string): Comment {
        const comment = this.comments.find(c => c.id === id);
        if (!comment) {
            throw new NotFoundException(`Comment with id ${id} not found`);
        }
        return comment;
    }

    remove(id: string): void {
        const idx = this.comments.findIndex(c => c.id === id);
        if (idx === -1) {
            throw new NotFoundException(`Comment with id ${id} not found`);
        }
        this.comments.splice(idx, 1);
    }

    removeByArticle(articleId: string): void {
        const indices = this.comments
        .map((c, i) => c.articleId === articleId ? i : -1)
        .filter(i => i !== -1)
        .reverse();
        indices.forEach(i => this.comments.splice(i, 1));
    }
 
    removeByAuthor(authorId: string): void {
        const indices = this.comments
        .map((c, i) => c.authorId === authorId ? i : -1)
        .filter(i => i !== -1)
        .reverse();
        indices.forEach(i => this.comments.splice(i, 1));
    }
        

}

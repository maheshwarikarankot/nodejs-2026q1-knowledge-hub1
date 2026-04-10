import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { randomUUID } from 'crypto';
import { ArticleStatus } from '../common/enums';
import { PaginatedResponse } from '../common/pagination/pagination.interface';
import { paginate, sortItems } from '../common/pagination/pagination.function';
import { CommentService } from '../comment/comment.service';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticleService {
    private readonly articles: Article[] = [];

    constructor(
        @Inject(forwardRef(() => CommentService))
        private readonly commentService: CommentService,
    ) {}

    findAll(filters?: { 
        status?: ArticleStatus;
        categoryId?: string;
        tag?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        order?: 'asc' | 'desc';
    }): PaginatedResponse<Article> {
        let result = [...this.articles];

        // Apply filters
        if (filters?.status) {
            result = result.filter(a => a.status === filters.status);
        }
        if (filters?.categoryId) {
            result = result.filter(a => a.categoryId === filters.categoryId);
        }
        if (filters?.tag) {
            result = result.filter(a => a.tags.includes(filters.tag));
        }

        // Apply sorting
        result = sortItems(result, filters?.sortBy, filters?.order);
        
        // Apply pagination
        return paginate(result, filters?.page, filters?.limit);
    }

    findOne(id: string) {
        const article = this.articles.find(a => a.id === id);
        if (!article) {
            throw new NotFoundException(`Article with id ${id} not found`);
        }
        return article;
    }

    create(dto: CreateArticleDto) {
        const now = Date.now();
        const newArticle : Article = { 
            id: randomUUID(), 
            title: dto.title,
            content: dto.content,
            status: dto.status ?? ArticleStatus.DRAFT,
            authorId: dto.authorId ?? null,
            categoryId: dto.categoryId ?? null, 
            tags: dto.tags ?? [],
            createdAt: now, 
            updatedAt: now 
        };
        this.articles.push(newArticle);
        return newArticle;
    }

    update(id: string, dto: UpdateArticleDto): Article {
        const article = this.articles.find(a => a.id === id);
        if (!article) {
            throw new NotFoundException(`Article with id ${id} not found`);
        }
        if(dto.title !== undefined) article.title = dto.title;
        if(dto.content !== undefined) article.content = dto.content;
        if(dto.status !== undefined) article.status = dto.status;
        if(dto.authorId !== undefined) article.authorId = dto.authorId;
        if(dto.categoryId !== undefined) article.categoryId = dto.categoryId;
        if(dto.tags !== undefined) article.tags = dto.tags;
        article.updatedAt = Date.now();
        return article;
    }

    remove(id: string): void{
    const index = this.articles.findIndex(a => a.id === id);
        if (index === -1) {
            throw new NotFoundException(`Article with id ${id} not found`);
        }

        this.commentService.removeByArticle(id);
        this.articles.splice(index, 1);
    }
    
    nullifyAuthor(userId: string): void {
        this.articles.forEach(a => { 
            if (a.authorId === userId){
            a.authorId = null; 
            }
        });
    }
 
    nullifyCategory(categoryId: string): void {
        this.articles.forEach(a => { 
         if (a.categoryId === categoryId){
            a.categoryId = null; 
            }
        });
    }
 
    articleExists(id: string): boolean {
        const article = this.articles.find((existingArticle) => existingArticle.id === id);
        return article !== undefined;
    }
}

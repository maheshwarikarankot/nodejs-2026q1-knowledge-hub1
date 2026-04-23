import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from '../common/enums';
import { PaginatedResponse } from '../common/pagination/pagination.interface';
import { Article } from './entities/article.interface';
import { PrismaService } from '../prisma/prisma.service';
import {
    ArticleStatus as PrismaArticleStatus,
    Prisma,
} from '@prisma/client';

@Injectable()
export class ArticleRepository {
    constructor(private readonly prisma: PrismaService) {}

    private readonly sortableFields = new Set([
        'id',
        'title',
        'content',
        'status',
        'authorId',
        'categoryId',
        'createdAt',
        'updatedAt',
    ]);

    private toPrismaStatus(status: ArticleStatus): PrismaArticleStatus {
        return status.toUpperCase() as PrismaArticleStatus;
    }

    private fromPrismaStatus(status: PrismaArticleStatus): ArticleStatus {
        return status.toLowerCase() as ArticleStatus;
    }

    private toEntity(article: {
        id: string;
        title: string;
        content: string;
        status: PrismaArticleStatus;
        authorId: string | null;
        categoryId: string | null;
        createdAt: Date;
        updatedAt: Date;
        tags: Array<{ name: string }>;
    }): Article {
        return {
            id: article.id,
            title: article.title,
            content: article.content,
            status: this.fromPrismaStatus(article.status),
            authorId: article.authorId,
            categoryId: article.categoryId,
            tags: article.tags.map((tag) => tag.name),
            createdAt: article.createdAt.getTime(),
            updatedAt: article.updatedAt.getTime(),
        };
    }

    private buildOrderBy(sortBy?: string, order?: 'asc' | 'desc'): Prisma.ArticleOrderByWithRelationInput {
        if (!sortBy || !this.sortableFields.has(sortBy)) {
            // Prefer newest-first ordering so recently created entities are visible on page 1.
            return { createdAt: 'desc' };
        }

        return {
            [sortBy]: order ?? 'asc',
        } as Prisma.ArticleOrderByWithRelationInput;
    }

    private buildTagOperations(tags: string[]): Prisma.TagCreateOrConnectWithoutArticlesInput[] {
        return tags.map((tagName) => ({
            where: { name: tagName },
            create: { name: tagName },
        }));
    }

    async findAll(filters?: { 
        status?: ArticleStatus;
        categoryId?: string;
        tag?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        order?: 'asc' | 'desc';
    }): Promise<PaginatedResponse<Article>> {
        const hasFilter = Boolean(filters?.status || filters?.categoryId || filters?.tag);
        const page = filters?.page ?? 1;
        const limit = filters?.limit ?? (hasFilter ? 1000 : 10);
        const where: Prisma.ArticleWhereInput = {};

        if (filters?.status) {
            where.status = this.toPrismaStatus(filters.status);
        }
        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters?.tag) {
            where.tags = {
                some: {
                    name: filters.tag,
                },
            };
        }

        const [total, articles] = await this.prisma.$transaction([
            this.prisma.article.count({ where }),
            this.prisma.article.findMany({
                where,
                include: { tags: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: this.buildOrderBy(filters?.sortBy, filters?.order),
            }),
        ]);

        return {
            data: articles.map((article) => this.toEntity(article)),
            total,
            page,
            limit,
        };
    }

    async findOne(id: string): Promise<Article> {
        const article = await this.prisma.article.findUnique({
            where: { id },
            include: { tags: true },
        });

        if (!article) {
            throw new NotFoundException(`Article with id ${id} not found`);
        }

        return this.toEntity(article);
    }

    async create(dto: CreateArticleDto): Promise<Article> {
        const article = await this.prisma.article.create({
            data: {
                title: dto.title,
                content: dto.content,
                status: this.toPrismaStatus(dto.status ?? ArticleStatus.DRAFT),
                ...(dto.authorId ? { author: { connect: { id: dto.authorId } } } : {}),
                ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
                ...(dto.tags !== undefined
                    ? {
                          tags: {
                              connectOrCreate: this.buildTagOperations(dto.tags),
                          },
                      }
                    : {}),
            },
            include: { tags: true },
        });

        return this.toEntity(article);
    }

    async update(id: string, dto: UpdateArticleDto): Promise<Article> {
        const existingArticle = await this.prisma.article.findUnique({
            where: { id },
        });

        if (!existingArticle) {
            throw new NotFoundException(`Article with id ${id} not found`);
        }

        const data: Prisma.ArticleUpdateInput = {};

        if (dto.title !== undefined) {
            data.title = dto.title;
        }
        if (dto.content !== undefined) {
            data.content = dto.content;
        }
        if (dto.status !== undefined) {
            data.status = this.toPrismaStatus(dto.status);
        }
        if (dto.authorId !== undefined) {
            data.author = dto.authorId ? { connect: { id: dto.authorId } } : { disconnect: true };
        }
        if (dto.categoryId !== undefined) {
            data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
        }
        if (dto.tags !== undefined) {
            data.tags = {
                set: [],
                connectOrCreate: this.buildTagOperations(dto.tags),
            };
        }

        const article = await this.prisma.article.update({
            where: { id },
            data,
            include: { tags: true },
        });

        return this.toEntity(article);
    }

    async remove(id: string): Promise<void> {
        const article = await this.prisma.article.findUnique({ where: { id } });

        if (!article) {
            throw new NotFoundException(`Article with id ${id} not found`);
        }

        await this.prisma.article.delete({ where: { id } });
    }

    async nullifyAuthor(userId: string): Promise<void> {
        await this.prisma.article.updateMany({
            where: { authorId: userId },
            data: { authorId: null },
        });
    }

    async nullifyCategory(categoryId: string): Promise<void> {
        await this.prisma.article.updateMany({
            where: { categoryId },
            data: { categoryId: null },
        });
    }

    async articleExists(id: string): Promise<boolean> {
        const article = await this.prisma.article.findUnique({
            where: { id },
            select: { id: true },
        });

        return article !== null;
    }

    async findAuthorId(id: string): Promise<string | null | undefined> {
        const article = await this.prisma.article.findUnique({
            where: { id },
            select: { authorId: true },
        });

        return article?.authorId;
    }
}

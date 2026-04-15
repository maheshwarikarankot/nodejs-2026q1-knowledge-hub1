import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginatedResponse } from '../common/pagination/pagination.interface';
import { Comment } from './entities/comment.entity';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentService {
    constructor(private readonly prisma: PrismaService) {}

    private readonly sortableFields = new Set(['id', 'content', 'articleId', 'authorId', 'createdAt']);

    private toEntity(comment: {
        id: string;
        content: string;
        articleId: string;
        authorId: string | null;
        createdAt: Date;
    }): Comment {
        return {
            id: comment.id,
            content: comment.content,
            articleId: comment.articleId,
            authorId: comment.authorId,
            createdAt: comment.createdAt.getTime(),
        };
    }

    private buildOrderBy(sortBy?: string, order?: 'asc' | 'desc'): Prisma.CommentOrderByWithRelationInput | undefined {
        if (!sortBy || !this.sortableFields.has(sortBy)) {
            return undefined;
        }

        return {
            [sortBy]: order ?? 'asc',
        } as Prisma.CommentOrderByWithRelationInput;
    }

    async findAll(
      articleId: string,
        opts?: {
            page?  : number;
            limit? : number;
            sortBy?: string;
            order? : 'asc' | 'desc';
        }  
    ): Promise<PaginatedResponse<Comment>> {
        const page = opts?.page ?? 1;
        const limit = opts?.limit ?? 10;

        const [total, comments] = await this.prisma.$transaction([
            this.prisma.comment.count({ where: { articleId } }),
            this.prisma.comment.findMany({
                where: { articleId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: this.buildOrderBy(opts?.sortBy, opts?.order),
            }),
        ]);

        return {
            data: comments.map((comment) => this.toEntity(comment)),
            total,
            page,
            limit,
        };
    }

    async create(dto: CreateCommentDto): Promise<Comment> {
        const articleExists = await this.prisma.article.findUnique({
            where: { id: dto.articleId },
            select: { id: true },
        });

        if (!articleExists) {
            throw new UnprocessableEntityException(`Article with id ${dto.articleId} does not exist`);
        }

        const comment = await this.prisma.comment.create({
            data: {
                content: dto.content,
                articleId: dto.articleId,
                authorId: dto.authorId ?? null,
            },
        });

        return this.toEntity(comment);
    }

    async findOne(id: string): Promise<Comment> {
        const comment = await this.prisma.comment.findUnique({ where: { id } });

        if (!comment) {
            throw new NotFoundException(`Comment with id ${id} not found`);
        }

        return this.toEntity(comment);
    }

    async remove(id: string): Promise<void> {
        const comment = await this.prisma.comment.findUnique({ where: { id } });

        if (!comment) {
            throw new NotFoundException(`Comment with id ${id} not found`);
        }

        await this.prisma.comment.delete({ where: { id } });
    }

    async findAuthorId(id: string): Promise<string | null | undefined> {
        const comment = await this.prisma.comment.findUnique({
            where: { id },
            select: { authorId: true },
        });

        return comment?.authorId;
    }
}

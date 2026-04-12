import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ArticleService } from './article.service';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleStatus } from '../common/enums';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Article } from './entities/article.entity';

@ApiTags('Articles')
@Controller('article')
export class ArticleController {
    constructor(private readonly articleService: ArticleService) {}

    @Post()
    @ApiOperation({ summary: 'Create article' })
    @ApiResponse({ status: 201 })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() articleDto: CreateArticleDto) {
        return this.articleService.create(articleDto);
    }   

    @Get()
    @ApiOperation({ summary: 'Get all articles' })
    @ApiQuery({ name: 'status',     required: false, enum: ArticleStatus })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'tag',        required: false })
    @ApiQuery({ name: 'page',       required: false, example: 1  })
    @ApiQuery({ name: 'limit',      required: false, example: 10 })
    @ApiQuery({ name: 'sortBy',     required: false, example: 'createdAt' })
    @ApiQuery({ name: 'order',      required: false, enum: ['asc', 'desc'] })
    @HttpCode(200)
    async findAll(
        @Query('status') status? : ArticleStatus,
        @Query('categoryId') categoryId? : string,
        @Query('tag') tag? : string,
        @Query('page') page? : number,
        @Query('limit') limit? : number,
        @Query('sortBy') sortBy? : string,
        @Query('order') order? : 'asc' | 'desc',
    ){
        return (await this.articleService.findAll({
            status,
            categoryId,
            tag,
            page : page ? Number(page) : undefined,
            limit : limit ? Number(limit) : undefined,
            sortBy,
            order,
            })).data;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get article by id' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'Article not found' })
    @HttpCode(200)
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Article> {
        return this.articleService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update article' })
    @ApiResponse({ status: 200, description: 'Article updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'Article not found' })
    @HttpCode(200)
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() articleDto: UpdateArticleDto): Promise<Article> {
        return this.articleService.update(id, articleDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete article' })
    @ApiResponse({ status: 204, description: 'Article deleted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'Article not found' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.articleService.remove(id);
    }       
}

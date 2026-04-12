import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('Comments')
@Controller('comment')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @Post()
    @ApiOperation({ summary: 'Create comment' })
    @ApiResponse({ status: 201, description: 'Comment created successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 422, description: 'Article not found' })
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() commentDto: CreateCommentDto) {
        return this.commentService.create(commentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all comments for an article' })
    @ApiQuery({ name: 'articleId', required: true  })
    @ApiQuery({ name: 'page',      required: false, example: 1  })
    @ApiQuery({ name: 'limit',     required: false, example: 10 })
    @ApiQuery({ name: 'sortBy',    required: false, example: 'createdAt' })
    @ApiQuery({ name: 'order',     required: false, enum: ['asc', 'desc'] })
    @ApiResponse({ status: 400, description: 'articleId is required' })
    @HttpCode(200)
    async findAll(
        @Query('articleId') articleId? : string,
        @Query('page') page? : number,
        @Query('limit') limit? : number,
        @Query('sortBy') sortBy? : string,
        @Query('order') order? : 'asc' | 'desc',        
    ) {
        if (!articleId) {
            throw new BadRequestException('articleId query parameter is required');
        }
          return (await this.commentService.findAll(
           articleId,{
           page: page ? Number(page) : undefined,
           limit: limit ? Number(limit) : undefined,
           sortBy,
           order,
          })).data;
    }   

    @Get(':id')
    @ApiOperation({ summary: 'Get comment by id' })
    @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    @HttpCode(200)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.commentService.findOne(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete comment' })
    @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.commentService.remove(id);
    }
}

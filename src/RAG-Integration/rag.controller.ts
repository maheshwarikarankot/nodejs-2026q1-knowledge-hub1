import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RagService } from './rag.service';
import { ReindexDto } from './dto/reindex.dto';
import { ReindexResponseDto } from './dto/reindex-response.dto';
import { RagSearchDto } from './dto/rag-search.dto';
import { RagSearchResponseDto } from './dto/rag-search-response.dto';
import { RagChatDto } from './dto/rag-chat.dto';
import { RagChatResponseDto } from './dto/rag-chat-response.dto';
import { ConversationHistoryResponseDto } from './dto/conversation-history-response.dto';

@ApiTags('RAG')
@ApiBearerAuth('access-token')
@Controller('ai/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Build or refresh the vector index from Knowledge Hub articles',
  })
  @ApiBody({ type: ReindexDto })
  @ApiResponse({ status: 200, type: ReindexResponseDto })
  @ApiResponse({
    status: 500,
    description: 'Embedding service authentication error',
  })
  @ApiResponse({
    status: 503,
    description: 'Vector DB or embedding service unavailable',
  })
  async indexArticles(@Body() dto: ReindexDto): Promise<ReindexResponseDto> {
    return this.ragService.indexArticles(dto);
  }

  @Post('search')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Semantic search across indexed Knowledge Hub articles',
  })
  @ApiBody({ type: RagSearchDto })
  @ApiResponse({ status: 200, type: RagSearchResponseDto })
  @ApiResponse({ status: 400, description: 'query is required' })
  @ApiResponse({
    status: 500,
    description: 'Embedding service authentication error',
  })
  @ApiResponse({
    status: 503,
    description: 'Vector DB or embedding service unavailable',
  })
  async searchArticles(
    @Body() dto: RagSearchDto,
  ): Promise<RagSearchResponseDto> {
    return this.ragService.searchArticles(dto);
  }

  @Post('chat')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Ask a question answered by Knowledge Hub articles (RAG)',
  })
  @ApiBody({ type: RagChatDto })
  @ApiResponse({ status: 200, type: RagChatResponseDto })
  @ApiResponse({ status: 400, description: 'question is required' })
  @ApiResponse({
    status: 500,
    description: 'AI generation service authentication error',
  })
  @ApiResponse({
    status: 503,
    description: 'Vector DB or AI generation service unavailable',
  })
  async chat(@Body() dto: RagChatDto): Promise<RagChatResponseDto> {
    return this.ragService.chat(dto);
  }

  @Delete('index/articles/:articleId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove all vector index entries for an article' })
  @ApiParam({ name: 'articleId', type: String, format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Vectors removed successfully' })
  @ApiResponse({
    status: 404,
    description: 'No index entries found for this article',
  })
  @ApiResponse({ status: 503, description: 'Vector DB unavailable' })
  async deleteArticleFromIndex(
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ): Promise<void> {
    return this.ragService.deleteArticleFromIndex(articleId);
  }

  @Get('chat/:conversationId/history')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retrieve message history for a conversation' })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID returned by POST /chat',
  })
  @ApiResponse({ status: 200, type: ConversationHistoryResponseDto })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  getHistory(
    @Param('conversationId') conversationId: string,
  ): ConversationHistoryResponseDto {
    return this.ragService.getConversationHistory(conversationId);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiThrottlerGuard } from './ai-throttler.guard';
import { AiUsageInterceptor } from './ai-usage.interceptor';
import { SummarizeArticleDto } from './dto/summarize.dto';
import { SummarizeArticleResponseDto } from './dto/summarizeArticleResponse.dto';
import { TranslateArticleDto } from './dto/translateArticle.dto';
import { TranslateArticleResponseDto } from './dto/translateArticleResponse.dto';
import { AnalyzeArticleDto } from './dto/analyzeArticle.dto';
import { AnalyzeArticleResponseDto } from './dto/analyzeArticleResponse.dto';
import { GenerateDto } from './dto/generate.dto';
import { GenerateResponseDto } from './dto/generateResponse.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiUsageInterceptor: AiUsageInterceptor,
  ) {}

  @Post('articles/:articleId/summarize')
  @HttpCode(200)
  @UseGuards(AiThrottlerGuard)
  @UseInterceptors(AiUsageInterceptor)
  @ApiOperation({ summary: 'Summarize an article using Gemini AI' })
  @ApiParam({ name: 'articleId', type: String, format: 'uuid' })
  @ApiBody({ type: SummarizeArticleDto })
  @ApiResponse({ status: 200, type: SummarizeArticleResponseDto })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'AI service authentication error' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  async summarizeArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponseDto> {
    return this.aiService.summarizeArticle(articleId, dto);
  }

  @Post('articles/:articleId/translate')
  @HttpCode(200)
  @UseGuards(AiThrottlerGuard)
  @UseInterceptors(AiUsageInterceptor)
  @ApiOperation({ summary: 'Translate an article using Gemini AI' })
  @ApiParam({ name: 'articleId', type: String, format: 'uuid' })
  @ApiBody({ type: TranslateArticleDto })
  @ApiResponse({ status: 200, type: TranslateArticleResponseDto })
  @ApiResponse({ status: 400, description: 'targetLanguage is required' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  async translateArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponseDto> {
    return this.aiService.translateArticle(articleId, dto);
  }

  @Post('articles/:articleId/analyze')
  @HttpCode(200)
  @UseGuards(AiThrottlerGuard)
  @UseInterceptors(AiUsageInterceptor)
  @ApiOperation({ summary: 'Analyze article content using Gemini AI' })
  @ApiParam({ name: 'articleId', type: String, format: 'uuid' })
  @ApiBody({ type: AnalyzeArticleDto })
  @ApiResponse({ status: 200, type: AnalyzeArticleResponseDto })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  async analyzeArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ): Promise<AnalyzeArticleResponseDto> {
    return this.aiService.analyzeArticle(articleId, dto);
  }

  @Post('generate')
  @HttpCode(200)
  @UseGuards(AiThrottlerGuard)
  @UseInterceptors(AiUsageInterceptor)
  @ApiOperation({ summary: 'Generate content from a prompt using Gemini AI' })
  @ApiBody({ type: GenerateDto })
  @ApiResponse({ status: 200, type: GenerateResponseDto })
  @ApiResponse({ status: 400, description: 'Prompt is required' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  async generateContent(
    @Body() dto: GenerateDto,
  ): Promise<GenerateResponseDto> {
    return this.aiService.generateContent(dto);
  }

  @Get('usage')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get AI usage statistics' })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics retrieved successfully',
  })
  getUsage(): object {
    return this.aiUsageInterceptor.getStats();
  }
}

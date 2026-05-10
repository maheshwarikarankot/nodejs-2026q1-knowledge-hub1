import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ArticleService } from '../article/article.service';
import { GeminiService } from './gemini.service';
import { SummarizeArticleDto } from './dto/summarize.dto';
import { SummarizeArticleResponseDto } from './dto/summarizeArticleResponse.dto';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { TranslateArticleDto } from './dto/translateArticle.dto';
import { TranslateArticleResponseDto } from './dto/translateArticleResponse.dto';
import { buildTranslatePrompt } from './prompts/translate.prompt';
import { AnalyzeArticleDto } from './dto/analyzeArticle.dto';
import { AnalyzeArticleResponseDto } from './dto/analyzeArticleResponse.dto';
import { buildAnalyzePrompt } from './prompts/analyze.prompt';
import { GenerateDto } from './dto/generate.dto';
import { GenerateResponseDto } from './dto/generateResponse.dto';
import { buildGeneratePrompt } from './prompts/generate.prompt';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly articleService: ArticleService,
    private readonly gemini: GeminiService,
  ) {}

  async summarizeArticle(
    articleId: string,
    dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponseDto> {
    const article = await this.articleService.findOne(articleId);
    if (!article) throw new NotFoundException('Article not found');

    const maxLength = dto.maxLength ?? 'medium';
    this.logger.log(
      `Summarizing article ${articleId} with maxLength=${maxLength}`,
    );

    const prompt = buildSummarizePrompt(
      article.title,
      article.content,
      maxLength,
    );
    const summary = await this.gemini.generateContent(prompt);

    const result = new SummarizeArticleResponseDto();
    result.articleId = articleId;
    result.summary = summary;
    result.originalLength = article.content.length;
    result.summaryLength = summary.length;
    return result;
  }

  async translateArticle(
    articleId: string,
    dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponseDto> {
    const article = await this.articleService.findOne(articleId);
    if (!article) throw new NotFoundException('Article not found');

    this.logger.log(
      `Translating article ${articleId} to ${dto.targetLanguage}`,
    );

    const prompt = buildTranslatePrompt(
      article.title,
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );

    const parsed = await this.gemini.generateJson<{
      translatedText: string;
      detectedLanguage: string;
    }>(prompt);

    const result = new TranslateArticleResponseDto();
    result.articleId = articleId;
    result.translatedText = parsed.translatedText;
    result.detectedLanguage = parsed.detectedLanguage;
    return result;
  }

  async analyzeArticle(
    articleId: string,
    dto: AnalyzeArticleDto,
  ): Promise<AnalyzeArticleResponseDto> {
    const article = await this.articleService.findOne(articleId);
    if (!article) throw new NotFoundException('Article not found');

    const task = dto.task ?? 'review';
    this.logger.log(`Analyzing article ${articleId} with task=${task}`);

    const prompt = buildAnalyzePrompt(article.title, article.content, task);

    const parsed = await this.gemini.generateJson<{
      analysis: string;
      suggestions: string[];
      severity: 'info' | 'warning' | 'error';
    }>(prompt);

    const result = new AnalyzeArticleResponseDto();
    result.articleId = articleId;
    result.analysis = parsed.analysis;
    result.suggestions = parsed.suggestions;
    result.severity = parsed.severity;
    return result;
  }

  async generateContent(dto: GenerateDto): Promise<GenerateResponseDto> {
    this.logger.log('Generating content from free-form prompt');

    const prompt = buildGeneratePrompt(dto.prompt);
    const text = await this.gemini.generateContent(prompt);

    const result = new GenerateResponseDto();
    result.result = text;
    return result;
  }
}

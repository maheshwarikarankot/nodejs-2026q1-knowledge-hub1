import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { ArticleService } from '../article/article.service';
import { Article } from '../article/entities/article.interface';
import { ArticleStatus } from '../common/enums';
import { QdrantService, QdrantPoint } from './qdrant.service';
import { EmbeddingService } from './embedding.service';
import { ChunkerService } from './services/chunker.service';
import { ReindexDto } from './dto/reindex.dto';
import { ReindexResponseDto } from './dto/reindex-response.dto';
import { RagSearchDto } from './dto/rag-search.dto';
import {
  RagSearchResponseDto,
  RagSearchResultDto,
} from './dto/rag-search-response.dto';
import { RagChatDto } from './dto/rag-chat.dto';
import { RagChatResponseDto, RagSourceDto } from './dto/rag-chat-response.dto';
import { ConversationHistoryResponseDto } from './dto/conversation-history-response.dto';
import { ConversationService } from './services/conversation.service';
import { RagGenerationService } from './rag-generation.service';
import { buildChatPrompt } from './prompts/chat.prompt';

// Fixed namespace UUID for deterministic chunk IDs across reindex runs
const RAG_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

// Maximum points per Qdrant upsert request
const UPSERT_BATCH = 100;

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly articleService: ArticleService,
    private readonly qdrant: QdrantService,
    private readonly embedder: EmbeddingService,
    private readonly chunker: ChunkerService,
    private readonly generator: RagGenerationService,
    private readonly conversation: ConversationService,
  ) {}

  async indexArticles(dto: ReindexDto): Promise<ReindexResponseDto> {
    await this.qdrant.ensureCollection();

    const articles = await this.fetchArticles(dto);
    this.logger.log(`Starting index of ${articles.length} articles`);

    let indexedChunks = 0;

    for (const article of articles) {
      // Remove stale vectors for this article before re-inserting
      await this.qdrant.deleteByArticleId(article.id);

      const fullText = `${article.title}\n\n${article.content}`;
      const chunks = this.chunker.chunk(fullText);
      const points: QdrantPoint[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const vector = await this.embedder.embed(chunks[i]);
        points.push({
          id: uuidv5(`${article.id}:${i}`, RAG_NAMESPACE),
          vector,
          payload: {
            articleId: article.id,
            articleTitle: article.title,
            chunk: chunks[i],
            chunkIndex: i,
            status: article.status,
            categoryId: article.categoryId ?? null,
            tags: article.tags,
            updatedAt: article.updatedAt,
          },
        });
      }

      // Batch upsert to stay within request size limits
      for (let b = 0; b < points.length; b += UPSERT_BATCH) {
        await this.qdrant.upsertPoints(points.slice(b, b + UPSERT_BATCH));
      }

      indexedChunks += chunks.length;
      this.logger.log(
        `Indexed article "${article.title}" — ${chunks.length} chunk(s)`,
      );
    }

    this.logger.log(
      `Index complete: ${articles.length} articles, ${indexedChunks} chunks`,
    );

    const result = new ReindexResponseDto();
    result.indexedArticles = articles.length;
    result.indexedChunks = indexedChunks;
    result.vectorCollection = this.qdrant.getCollectionName();
    return result;
  }

  async searchArticles(dto: RagSearchDto): Promise<RagSearchResponseDto> {
    const queryVector = await this.embedder.embed(dto.query);

    const hits = await this.qdrant.search(queryVector, {
      limit: dto.limit ?? 5,
      articleStatus: dto.articleStatus,
      categoryId: dto.categoryId,
      tags: dto.tags,
    });

    const response = new RagSearchResponseDto();
    response.results = hits.map((hit) => {
      const item = new RagSearchResultDto();
      item.articleId = hit.articleId;
      item.articleTitle = hit.articleTitle;
      item.chunk = hit.chunk;
      item.similarity = hit.similarity;
      return item;
    });
    return response;
  }

  async chat(dto: RagChatDto): Promise<RagChatResponseDto> {
    const conversationId = dto.conversationId ?? uuidv4();
    const history = this.conversation.getHistory(conversationId);

    const queryVector = await this.embedder.embed(dto.question);
    const hits = await this.qdrant.search(queryVector, { limit: 5 });

    const prompt = buildChatPrompt(dto.question, hits, history);
    const answer = await this.generator.generate(prompt);

    this.conversation.addMessages(conversationId, [
      { role: 'user', content: dto.question },
      { role: 'assistant', content: answer },
    ]);

    const response = new RagChatResponseDto();
    response.answer = answer;
    response.conversationId = conversationId;
    response.sources = hits.map((hit) => {
      const source = new RagSourceDto();
      source.articleId = hit.articleId;
      source.articleTitle = hit.articleTitle;
      source.relevantChunk = hit.chunk;
      return source;
    });
    return response;
  }

  async deleteArticleFromIndex(articleId: string): Promise<void> {
    const count = await this.qdrant.countByArticleId(articleId);
    if (count === 0) {
      throw new NotFoundException(
        `No index entries found for article ${articleId}`,
      );
    }
    await this.qdrant.deleteByArticleId(articleId);
    this.logger.log(
      `Removed ${count} vector(s) for article ${articleId} from index`,
    );
  }

  getConversationHistory(
    conversationId: string,
  ): ConversationHistoryResponseDto {
    if (!this.conversation.hasConversation(conversationId)) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    const response = new ConversationHistoryResponseDto();
    response.conversationId = conversationId;
    response.messages = this.conversation.getHistory(conversationId);
    return response;
  }

  private async fetchArticles(dto: ReindexDto): Promise<Article[]> {
    if (dto.articleIds && dto.articleIds.length > 0) {
      const settled = await Promise.allSettled(
        dto.articleIds.map((id) => this.articleService.findOne(id)),
      );
      return settled
        .filter(
          (r): r is PromiseFulfilledResult<Article> => r.status === 'fulfilled',
        )
        .map((r) => r.value);
    }

    const status =
      (dto.onlyPublished ?? true) ? ArticleStatus.PUBLISHED : undefined;

    const response = await this.articleService.findAll({
      status,
      limit: 10_000,
    });
    return response.data;
  }
}

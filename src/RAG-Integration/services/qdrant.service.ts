import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface SearchOptions {
  limit: number;
  articleStatus?: string;
  categoryId?: string;
  tags?: string[];
}

export interface SearchHit {
  articleId: string;
  articleTitle: string;
  chunk: string;
  similarity: number;
}

interface QdrantSearchResponse {
  result: Array<{
    id: string;
    score: number;
    payload: Record<string, unknown>;
  }>;
}

const VECTOR_SIZE = 768;

@Injectable()
export class QdrantService {
  private readonly baseUrl: string;
  private readonly collection: string;

  constructor(private readonly logger: LoggerService) {
    this.baseUrl = (
      process.env.RAG_VECTOR_DB_URL ?? 'http://localhost:6333'
    ).replace(/\/$/, '');
    this.collection =
      process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(
          `Qdrant ${method} ${path} → ${response.status}: ${text}`,
        );
      }

      return response.status === 204
        ? (null as T)
        : ((await response.json()) as T);
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error('Qdrant request failed', (err as Error).stack, {
        message: (err as Error).message,
      });
      throw new ServiceUnavailableException('Vector database unavailable');
    }
  }

  async ensureCollection(): Promise<void> {
    try {
      const res = await fetch(
        `${this.baseUrl}/collections/${this.collection}`,
        { signal: AbortSignal.timeout(10_000) },
      );
      if (res.status === 404) {
        await this.request('PUT', `/collections/${this.collection}`, {
          vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
        });
        this.logger.log(`Created Qdrant collection: ${this.collection}`);
      } else if (!res.ok) {
        throw new Error(`Collection check failed: ${res.status}`);
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(
        'Qdrant ensureCollection failed',
        (err as Error).stack,
        { message: (err as Error).message },
      );
      throw new ServiceUnavailableException('Vector database unavailable');
    }
  }

  async countByArticleId(articleId: string): Promise<number> {
    const data = await this.request<{ result: { count: number } }>(
      'POST',
      `/collections/${this.collection}/points/count`,
      {
        exact: true,
        filter: {
          must: [{ key: 'articleId', match: { value: articleId } }],
        },
      },
    );
    return data.result.count;
  }

  async deleteByArticleId(articleId: string): Promise<void> {
    await this.request(
      'POST',
      `/collections/${this.collection}/points/delete`,
      {
        filter: {
          must: [{ key: 'articleId', match: { value: articleId } }],
        },
      },
    );
  }

  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    if (points.length === 0) return;
    await this.request('PUT', `/collections/${this.collection}/points`, {
      points,
    });
  }

  async search(vector: number[], options: SearchOptions): Promise<SearchHit[]> {
    const filter = this.buildFilter(options);

    const body: Record<string, unknown> = {
      vector,
      limit: options.limit,
      with_payload: true,
    };
    if (filter) body.filter = filter;

    const data = await this.request<QdrantSearchResponse>(
      'POST',
      `/collections/${this.collection}/points/search`,
      body,
    );

    return data.result.map((hit) => ({
      articleId: hit.payload['articleId'] as string,
      articleTitle: hit.payload['articleTitle'] as string,
      chunk: hit.payload['chunk'] as string,
      similarity: hit.score,
    }));
  }

  private buildFilter(
    options: SearchOptions,
  ): Record<string, unknown> | undefined {
    const must: unknown[] = [];

    if (options.articleStatus) {
      must.push({ key: 'status', match: { value: options.articleStatus } });
    }
    if (options.categoryId) {
      must.push({ key: 'categoryId', match: { value: options.categoryId } });
    }
    if (options.tags && options.tags.length > 0) {
      must.push({ key: 'tags', match: { any: options.tags } });
    }

    return must.length > 0 ? { must } : undefined;
  }

  getCollectionName(): string {
    return this.collection;
  }
}

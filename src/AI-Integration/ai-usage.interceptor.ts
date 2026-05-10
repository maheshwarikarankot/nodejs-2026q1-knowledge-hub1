import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { ArticleService } from '../article/article.service';
import { GeminiService } from './gemini.service';

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

interface UsageStats {
  totalRequests: number;
  requestsByEndpoint: Record<string, number>;
  tokenUsage: number;
}

@Injectable()
export class AiUsageInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly stats = {
    totalRequests: 0,
    requestsByEndpoint: {} as Record<string, number>,
  };

  constructor(
    private readonly articleService: ArticleService,
    private readonly geminiService: GeminiService,
  ) {
    this.ttlMs = parseInt(process.env.AI_CACHE_TTL_SEC ?? '300', 10) * 1000;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const endpoint = this.extractEndpoint(request);
    const articleId = this.extractArticleId(request);

    return from(this.resolveUpdatedAt(articleId)).pipe(
      switchMap((updatedAt) => {
        const cacheKey = this.buildCacheKey(request, updatedAt);

        const cached = this.fromCache(cacheKey);
        if (cached !== undefined) {
          return of(cached);
        }

        return next.handle().pipe(
          tap((data) => {
            this.toCache(cacheKey, data);
            this.track(endpoint);
          }),
        );
      }),
    );
  }

  getStats(): UsageStats {
    return {
      totalRequests: this.stats.totalRequests,
      requestsByEndpoint: { ...this.stats.requestsByEndpoint },
      tokenUsage: this.geminiService.getTokenUsage(),
    };
  }

  private async resolveUpdatedAt(articleId?: string): Promise<string> {
    if (!articleId) return '';
    try {
      const article = await this.articleService.findOne(articleId);
      return String(article.updatedAt);
    } catch {
      return '';
    }
  }

  private buildCacheKey(request: Request, updatedAt: string): string {
    const body = (request as any).body ?? {};
    return `${request.url}:${JSON.stringify(body)}:${updatedAt}`;
  }

  private extractArticleId(request: Request): string | undefined {
    const match = /\/ai\/articles\/([^/]+)\//.exec(request.url);
    return match?.[1];
  }

  private extractEndpoint(request: Request): string {
    const match = /\/ai\/articles\/[^/]+\/(\w+)/.exec(request.url);
    return match?.[1] ?? request.url.split('/').pop() ?? 'unknown';
  }

  private fromCache<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  private toCache(key: string, data: unknown): void {
    this.cache.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }

  private track(endpoint: string): void {
    this.stats.totalRequests += 1;
    this.stats.requestsByEndpoint[endpoint] =
      (this.stats.requestsByEndpoint[endpoint] ?? 0) + 1;
  }
}

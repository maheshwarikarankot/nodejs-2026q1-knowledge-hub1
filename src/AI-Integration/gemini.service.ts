import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly maxRetries = 3;
  private totalTokensUsed = 0;

  constructor(private readonly logger: LoggerService) {
    this.apiKey = process.env.GEMINI_API_KEY ?? '';
    this.baseUrl =
      process.env.GEMINI_API_BASE_URL ??
      'https://generativelanguage.googleapis.com';
    this.model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  }

  async generateContent(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        this.logger.warn(
          `Gemini API retry attempt ${attempt}/${this.maxRetries} after ${delayMs}ms`,
          { model: this.model, attempt },
        );
        await this.delay(delayMs);
      }

      const callStart = Date.now();

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(30_000),
        });

        if (response.status === 401 || response.status === 403) {
          throw new InternalServerErrorException(
            'AI service authentication error',
          );
        }

        if (response.status === 429) {
          lastError = new ServiceUnavailableException(
            'Upstream AI rate limit exceeded',
          );
          continue;
        }

        if (!response.ok) {
          lastError = new ServiceUnavailableException(
            `AI service error: ${response.status}`,
          );
          continue;
        }

        const data = (await response.json()) as GeminiApiResponse;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!text) {
          throw new ServiceUnavailableException(
            'AI service returned empty response',
          );
        }

        const tokens = data.usageMetadata?.totalTokenCount ?? 0;
        this.totalTokensUsed += tokens;

        this.logger.log('Gemini API call completed', {
          model: this.model,
          durationMs: Date.now() - callStart,
          tokens,
        });

        return text;
      } catch (err) {
        if (
          err instanceof InternalServerErrorException ||
          err instanceof ServiceUnavailableException
        ) {
          throw err;
        }
        lastError = err;
      }
    }

    this.logger.error(
      'Gemini API failed after retries',
      (lastError as Error)?.stack,
      { message: (lastError as Error)?.message },
    );
    throw new ServiceUnavailableException('AI service unavailable');
  }

  async generateJson<T>(prompt: string): Promise<T> {
    const raw = await this.generateContent(prompt);
    return this.parseJsonResponse<T>(raw);
  }

  parseJsonResponse<T>(raw: string): T {
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    try {
      return JSON.parse(stripped) as T;
    } catch {
      throw new ServiceUnavailableException(
        'AI service returned malformed JSON',
      );
    }
  }

  getTokenUsage(): number {
    return this.totalTokensUsed;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text: string }>;
    };
  }>;
}

@Injectable()
export class RagGenerationService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly maxRetries = 3;

  constructor(private readonly logger: LoggerService) {
    this.apiKey = process.env.GEMINI_API_KEY ?? '';
    this.baseUrl =
      process.env.GEMINI_API_BASE_URL ??
      'https://generativelanguage.googleapis.com';
    this.model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  }

  async generate(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        this.logger.warn(
          `RAG generation retry ${attempt}/${this.maxRetries} after ${delayMs}ms`,
          { model: this.model, attempt },
        );
        await this.delay(delayMs);
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(30_000),
        });

        if (response.status === 401 || response.status === 403) {
          throw new InternalServerErrorException(
            'AI generation service authentication error',
          );
        }

        if (response.status === 429) {
          lastError = new ServiceUnavailableException(
            'Upstream generation rate limit exceeded',
          );
          continue;
        }

        if (!response.ok) {
          lastError = new ServiceUnavailableException(
            `AI generation service error: ${response.status}`,
          );
          continue;
        }

        const data = (await response.json()) as GeminiGenerateResponse;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!text) {
          throw new ServiceUnavailableException(
            'AI generation service returned empty response',
          );
        }

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
      'RAG generation failed after retries',
      (lastError as Error)?.stack,
      { message: (lastError as Error)?.message },
    );
    throw new ServiceUnavailableException('AI generation service unavailable');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

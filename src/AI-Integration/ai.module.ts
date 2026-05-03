import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { AiThrottlerGuard } from './ai-throttler.guard';
import { AiUsageInterceptor } from './ai-usage.interceptor';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [
    ArticleModule,
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: 60000,
          limit: parseInt(process.env.AI_RATE_LIMIT_RPM ?? '20', 10),
        },
      ],
    }),
  ],
  controllers: [AiController],
  providers: [AiService, GeminiService, AiThrottlerGuard, AiUsageInterceptor],
})
export class AiModule {}

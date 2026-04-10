import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { ArticleModule } from './article/article.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CommentModule } from './comment/comment.module';
import { LoggingInterceptor } from './common/logging.interceptor';

@Module({
  imports: [UserModule, CategoryModule, ArticleModule, CommentModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }],
})
export class AppModule {}

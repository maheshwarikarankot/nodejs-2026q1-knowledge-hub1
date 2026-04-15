import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { ArticleModule } from './article/article.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { APP_GUARD } from '@nestjs/core';
import { CommentModule } from './comment/comment.module';
import { LoggingInterceptor } from './common/logging.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthRbacGuard } from './auth/guards/auth-rbac.guard';

@Module({
  imports: [UserModule, CategoryModule, ArticleModule, CommentModule, PrismaModule, AuthModule, JwtModule.register({})],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: AuthRbacGuard },
  ],
})
export class AppModule {}

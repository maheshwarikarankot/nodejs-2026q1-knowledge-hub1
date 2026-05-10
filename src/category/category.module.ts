import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoryRepository } from './category.repository';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [PrismaModule, ArticleModule],
  providers: [CategoryService, CategoryRepository],
  controllers: [CategoryController],
  exports: [CategoryService],
})
export class CategoryModule {}

import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ArticleService } from '../article/article.service';
import { CategoryEntity } from './entities/category.entity';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoryService {
  constructor(
    private readonly articleService: ArticleService,
    private readonly categoryRepository: CategoryRepository,
  ) {}
 
  findAll(): Promise<CategoryEntity[]> {
    return this.categoryRepository.findAll();
  }
 
  findOne(id: string): Promise<CategoryEntity> {
    return this.categoryRepository.findOne(id);
  }
 
  create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    return this.categoryRepository.create(dto);
  }
 
  update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    return this.categoryRepository.update(id, dto);
  }
 
  async remove(id: string): Promise<void> {
    await this.articleService.nullifyCategory(id);
    await this.categoryRepository.remove(id);
  }
}
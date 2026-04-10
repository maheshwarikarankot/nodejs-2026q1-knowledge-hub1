import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { randomUUID } from 'crypto';
import { ArticleService } from '../article/article.service';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
    private readonly categories: Category[] = [];

  constructor(private readonly articleService: ArticleService) {}
 
  findAll(): Category[] {
    return this.categories;
  }
 
  findOne(id: string): Category {
    const category = this.categories.find(c => c.id === id);
    if (!category){
        throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }
 
  create(dto: CreateCategoryDto): Category {
    const newCategory: Category = {
      id         : randomUUID(),
      name       : dto.name,
      description: dto.description,
    };
    this.categories.push(newCategory);
    return newCategory;
  }
 
  update(id: string, dto: UpdateCategoryDto): Category {
    const category = this.categories.find(c => c.id === id);

    if (!category){
        throw new NotFoundException(`Category with id ${id} not found`);
    }
    if (dto.name !== undefined){
        category.name = dto.name;
    }
    if (dto.description !== undefined) {
        category.description = dto.description;
    }
    return category;
  }
 
  remove(id: string): void {
    const idx = this.categories.findIndex(c => c.id === id);

    if (idx === -1){
        throw new NotFoundException(`Category with id ${id} not found`);
    }

    this.articleService.nullifyCategory(id);

    this.categories.splice(idx, 1);
  }
}

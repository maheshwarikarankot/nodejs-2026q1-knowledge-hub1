import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(category: { id: string; name: string; description: string }): Category {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
    };
  }
 
  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany();
    return categories.map((category) => this.toEntity(category));
  }
 
  async findOne(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category){
        throw new NotFoundException(`Category with id ${id} not found`);
    }

    return this.toEntity(category);
  }
 
  async create(dto: CreateCategoryDto): Promise<Category> {
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    return this.toEntity(category);
  }
 
  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category){
        throw new NotFoundException(`Category with id ${id} not found`);
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });

    return this.toEntity(updatedCategory);
  }
 
  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category){
        throw new NotFoundException(`Category with id ${id} not found`);
    }

    await this.prisma.category.delete({ where: { id } });
  }
}

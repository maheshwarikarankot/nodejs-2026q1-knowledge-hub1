import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    @ApiOperation({ summary: 'Create category' })
    @ApiResponse({ status: 201 })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @HttpCode(201)
    create(@Body() categoryDto: CreateCategoryDto): Category {
        return this.categoryService.create(categoryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all categories' })
    @ApiOkResponse()
    @HttpCode(200)
    findAll(){
        return this.categoryService.findAll();
    }       

    @Get(':id')
    @ApiOperation({ summary: 'Get category by id' })
    @ApiOkResponse()
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @HttpCode(200)
    findOne(@Param('id',ParseUUIDPipe) id: string): Category {
        return this.categoryService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update category' })
    @ApiOkResponse()
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @HttpCode(200)
    update(@Param('id', ParseUUIDPipe) id: string, @Body() categoryDto: UpdateCategoryDto): Category {
        return this.categoryService.update(id, categoryDto);
    }   

    @Delete(':id')
    @ApiOperation({ summary: 'Delete category' })
    @ApiResponse({ status: 204, description: 'Category deleted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid uuid' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @HttpCode(204)
    remove(@Param('id', ParseUUIDPipe) id: string): void {
        this.categoryService.remove(id);
    }
}

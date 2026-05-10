import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ArticleStatus } from '../../common/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateArticleDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated content...' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({ enum: ArticleStatus })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional({ example: 'uuid of author' })
  @IsUUID()
  @IsOptional()
  authorId?: string; // refers to User

  @ApiPropertyOptional({ example: 'uuid of category' })
  @IsUUID()
  @IsOptional()
  categoryId?: string; // refers to Category

  @ApiPropertyOptional({ example: ['nestjs'] })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  tags?: string[]; // array of tag names
}

import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ArticleStatus } from '../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({ example: 'Getting Started with NestJS' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'NestJS is a progressive Node.js framework...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: ArticleStatus, default: ArticleStatus.DRAFT })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiProperty({ example: 'uuid of author' })
  @IsUUID()
  @IsOptional()
  authorId?: string; // refers to User

  @ApiProperty({ example: 'uuid of category' })
  @IsUUID()
  @IsOptional()
  categoryId?: string; // refers to Category

  @ApiProperty({ example: ['nestjs', 'nodejs'] })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  tags?: string[]; // array of tag names
}

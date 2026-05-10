import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ArticleStatus } from '../../common/enums';

export class RagSearchDto {
  @ApiProperty({ description: 'Natural language search query' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;

  @ApiPropertyOptional({
    enum: ArticleStatus,
    description: 'Filter results by article status',
  })
  @IsOptional()
  @IsEnum(ArticleStatus)
  articleStatus?: ArticleStatus;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filter results by category ID',
  })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Filter results to articles that have at least one of these tags',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

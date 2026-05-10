import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TranslateArticleDto {
  @ApiProperty({
    description: 'Target language for translation',
    example: 'Spanish',
  })
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @ApiPropertyOptional({
    description: 'Source language of the article',
    example: 'English',
  })
  @IsString()
  @IsOptional()
  sourceLanguage?: string;
}

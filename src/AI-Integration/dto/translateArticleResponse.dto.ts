import { ApiProperty } from '@nestjs/swagger';

export class TranslateArticleResponseDto {
  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiProperty()
  translatedText: string;

  @ApiProperty({ description: 'Detected or provided source language' })
  detectedLanguage: string;
}

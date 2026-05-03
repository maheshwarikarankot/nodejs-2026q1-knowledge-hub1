import { ApiProperty } from '@nestjs/swagger';

export class SummarizeArticleResponseDto {
  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  originalLength: number;

  @ApiProperty()
  summaryLength: number;
}

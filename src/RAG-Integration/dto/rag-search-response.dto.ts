import { ApiProperty } from '@nestjs/swagger';

export class RagSearchResultDto {
  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiProperty()
  articleTitle: string;

  @ApiProperty({ description: 'The matching text chunk from the article' })
  chunk: string;

  @ApiProperty({
    description: 'Cosine similarity score (0 – 1)',
    minimum: 0,
    maximum: 1,
  })
  similarity: number;
}

export class RagSearchResponseDto {
  @ApiProperty({ type: [RagSearchResultDto] })
  results: RagSearchResultDto[];
}

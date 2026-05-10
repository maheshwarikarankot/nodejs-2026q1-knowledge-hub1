import { ApiProperty } from '@nestjs/swagger';

export class ReindexResponseDto {
  @ApiProperty({ description: 'Number of articles indexed' })
  indexedArticles: number;

  @ApiProperty({
    description: 'Total number of text chunks stored in the vector DB',
  })
  indexedChunks: number;

  @ApiProperty({ description: 'Qdrant collection name used' })
  vectorCollection: string;
}

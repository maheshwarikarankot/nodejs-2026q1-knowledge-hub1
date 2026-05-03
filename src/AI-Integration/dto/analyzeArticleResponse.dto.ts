import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeArticleResponseDto {
  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiProperty()
  analysis: string;

  @ApiProperty({ type: [String] })
  suggestions: string[];

  @ApiProperty({ enum: ['info', 'warning', 'error'] })
  severity: 'info' | 'warning' | 'error';
}

import { ApiProperty } from '@nestjs/swagger';

export class RagSourceDto {
  @ApiProperty({ format: 'uuid' })
  articleId: string;

  @ApiProperty()
  articleTitle: string;

  @ApiProperty({
    description: 'The chunk from this article that was passed to the model',
  })
  relevantChunk: string;
}

export class RagChatResponseDto {
  @ApiProperty({
    description: 'AI-generated answer grounded in Knowledge Hub articles',
  })
  answer: string;

  @ApiProperty({
    type: [RagSourceDto],
    description: 'Articles used as context for the answer',
  })
  sources: RagSourceDto[];

  @ApiProperty({
    description:
      'Conversation ID — pass this back to continue the conversation',
  })
  conversationId: string;
}

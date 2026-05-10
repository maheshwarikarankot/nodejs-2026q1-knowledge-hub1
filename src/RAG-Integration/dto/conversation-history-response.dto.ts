import { ApiProperty } from '@nestjs/swagger';

export class ConversationMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @ApiProperty()
  content: string;
}

export class ConversationHistoryResponseDto {
  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;

  @ApiProperty({
    type: [ConversationMessageDto],
    description: 'Messages in chronological order (oldest first)',
  })
  messages: ConversationMessageDto[];
}

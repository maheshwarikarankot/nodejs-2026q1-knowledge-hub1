import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RagChatDto {
  @ApiProperty({ description: 'Question to ask the Knowledge Hub' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({
    description:
      'Conversation ID for multi-turn chat — omit to start a new conversation',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}

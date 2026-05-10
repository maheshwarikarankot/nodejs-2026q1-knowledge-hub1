import { Injectable } from '@nestjs/common';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ConversationService {
  private readonly store = new Map<string, ConversationMessage[]>();
  private readonly maxMessages: number;

  constructor() {
    this.maxMessages = parseInt(
      process.env.RAG_CONVERSATION_MAX_MESSAGES ?? '20',
      10,
    );
  }

  getHistory(conversationId: string): ConversationMessage[] {
    return [...(this.store.get(conversationId) ?? [])];
  }

  addMessages(conversationId: string, messages: ConversationMessage[]): void {
    const history = this.store.get(conversationId) ?? [];
    history.push(...messages);

    if (history.length > this.maxMessages) {
      history.splice(0, history.length - this.maxMessages);
    }

    this.store.set(conversationId, history);
  }

  hasConversation(conversationId: string): boolean {
    return this.store.has(conversationId);
  }
}

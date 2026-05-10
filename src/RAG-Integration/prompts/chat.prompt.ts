import { ConversationMessage } from '../services/conversation.service';
import { SearchHit } from '../services/qdrant.service';

export function buildChatPrompt(
  question: string,
  context: SearchHit[],
  history: ConversationMessage[],
): string {
  const contextSection =
    context.length > 0
      ? context
          .map((h) => `[Article: "${h.articleTitle}"]\n${h.chunk}`)
          .join('\n\n---\n\n')
      : 'No relevant articles were found in the Knowledge Hub for this question.';

  const historySection =
    history.length > 0
      ? history
          .map(
            (m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`,
          )
          .join('\n')
      : '';

  return `You are a helpful AI assistant for the Knowledge Hub platform. Answer the user's question using ONLY the article context provided below. Be concise and accurate. If the context does not contain enough information to answer, say so clearly — do not invent details.

## Knowledge Hub Context

${contextSection}

${historySection ? `## Conversation History\n${historySection}\n\n` : ''}## Current Question
${question}

## Answer`;
}

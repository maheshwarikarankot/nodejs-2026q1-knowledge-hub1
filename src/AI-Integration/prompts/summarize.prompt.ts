export function buildSummarizePrompt(
  title: string,
  content: string,
  maxLength: 'short' | 'medium' | 'detailed',
): string {
  const lengthInstruction = {
    short: 'Provide a concise 2-3 sentence summary.',
    medium: 'Provide a 1-2 paragraph summary covering the main points.',
    detailed:
      'Provide a detailed 3-4 paragraph summary covering all key points and insights.',
  }[maxLength];

  return `Summarize the following article. ${lengthInstruction}

Title: ${title}

Content:
${content}

Respond with the summary text only.`;
}

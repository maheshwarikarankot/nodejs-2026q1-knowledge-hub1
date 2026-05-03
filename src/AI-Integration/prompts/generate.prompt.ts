export function buildGeneratePrompt(userPrompt: string): string {
  return `You are a helpful assistant for a Knowledge Hub platform that manages articles, categories, and technical content.

${userPrompt}`;
}

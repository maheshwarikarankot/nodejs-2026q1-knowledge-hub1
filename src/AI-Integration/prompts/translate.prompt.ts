export function buildTranslatePrompt(
  title: string,
  content: string,
  targetLanguage: string,
  sourceLanguage?: string,
): string {
  const sourcePart = sourceLanguage
    ? `The source language is ${sourceLanguage}.`
    : 'Auto-detect the source language.';

  return `Translate the following article to ${targetLanguage}. ${sourcePart}

Return ONLY a valid JSON object with exactly these two fields:
{
  "translatedText": "<full translated content>",
  "detectedLanguage": "<the detected or provided source language name in English>"
}

Article Title: ${title}

Article Content:
${content}`;
}

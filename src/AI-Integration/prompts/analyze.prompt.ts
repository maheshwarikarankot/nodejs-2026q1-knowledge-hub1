type AnalyzeTask = 'review' | 'bugs' | 'optimize' | 'explain';

const taskInstructions: Record<AnalyzeTask, string> = {
  review:
    'Review the article for content quality, clarity, accuracy, and overall writing standard.',
  bugs: 'Identify technical errors, inaccuracies, incorrect facts, or bugs in any code examples.',
  optimize:
    'Suggest improvements to content structure, readability, flow, and engagement.',
  explain:
    'Provide a detailed explanation of the key concepts and ideas presented in the article.',
};

export function buildAnalyzePrompt(
  title: string,
  content: string,
  task: AnalyzeTask,
): string {
  return `You are a technical content analyst. ${taskInstructions[task]}

Return ONLY a valid JSON object with exactly these three fields:
{
  "analysis": "<your detailed analysis as a single string>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...],
  "severity": "<one of: info, warning, error>"
}

Severity guide:
- "error"   → critical issues requiring immediate attention
- "warning" → moderate issues that should be addressed
- "info"    → minor suggestions or general improvements

Article Title: ${title}

Article Content:
${content}`;
}

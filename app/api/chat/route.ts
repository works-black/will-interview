import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '@/lib/interview-prompts';
import type { Phase, QuestionResponse } from '@/lib/types';

const client = new Anthropic();

export async function POST(request: Request) {
  const { messages, phase, summary } = await request.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    phase: Phase;
    summary: string;
  };

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: getSystemPrompt(phase, summary),
    messages,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return Response.json(
      { error: 'Failed to parse question response' },
      { status: 500 }
    );
  }

  const result: QuestionResponse = JSON.parse(jsonMatch[0]);
  return Response.json(result);
}

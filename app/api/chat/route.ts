import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '@/lib/interview-prompts';
import type { Phase } from '@/lib/types';

const client = new Anthropic();

export async function POST(request: Request) {
  const { messages, phase } = await request.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    phase: Phase;
  };

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: getSystemPrompt(phase),
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

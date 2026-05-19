import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const conversationText = messages
    .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `以下の面談会話から、利用者が興味を示した「場所・活動・やりたいこと」に関するキーワードを抽出してください。

会話：
${conversationText}

出力形式（JSONのみ、他のテキスト不要）：
{
  "keywords": [
    { "text": "水彩画", "type": "activity" },
    { "text": "豊橋市", "type": "location" },
    { "text": "屋外講座", "type": "activity" },
    { "text": "花を見る", "type": "activity" }
  ]
}

typeは "activity"（活動・やりたいこと）か "location"（場所・地域）のいずれかです。
キーワードは最大8個まで。会話から読み取れるものだけを抽出してください。`,
    }],
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ keywords: [] });
  }
}

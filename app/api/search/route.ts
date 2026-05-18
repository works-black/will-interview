import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { query, location, category } = await request.json();

  const systemPrompt = `あなたは高齢者外出支援のコーディネーターアシスタントです。
高齢者が興味を持った活動・施設について、地域の具体的な情報をWeb検索して提供します。

回答フォーマット（JSON）：
{
  "results": [
    {
      "name": "施設・教室名",
      "category": "カテゴリ（水彩画/体操/公民館等）",
      "location": "住所・最寄り駅",
      "schedule": "開催日時・頻度",
      "fee": "参加費用",
      "contact": "電話・URL",
      "beginner_friendly": true/false,
      "elder_friendly": true/false,
      "note": "高齢者向けポイント・備考"
    }
  ],
  "search_summary": "検索結果の概要（2-3文）",
  "suggestion": "コーディネーターへのアドバイス"
}

必ずWeb検索を実行してから回答してください。
JSON以外のテキストは出力しないでください。`;

  const userMessage = `${location}および近隣エリアで「${query}」に関する情報を検索してください。
カテゴリ: ${category || '指定なし'}
対象: 高齢者・初心者歓迎の活動を優先
件数: 3〜5件程度`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (client.messages.create as any)({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    // web_search_20250305 is a beta server-side tool not yet in the SDK's Tool union
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textBlock = (response.content as any[]).find((b: any) => b.type === 'text');
  const text: string = textBlock?.text ?? '{}';

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ results: [], search_summary: text });
  }
}

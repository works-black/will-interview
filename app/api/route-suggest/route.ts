import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

const PRIORITY_GUIDES: Record<string, string> = {
  distance: '乗り換え回数が少なく、歩く距離が短いルートを最優先。駅からの徒歩距離を必ず記載。',
  cost: '交通費が最も安いルートを最優先。バス・乗り継ぎ割引なども考慮。',
  time: '所要時間が最も短いルートを最優先。特急・快速の活用を検討。',
  comfort: '途中に休憩できる場所（駅の待合室・コンビニ・公園のベンチ等）が多いルートを優先。階段が少ない、エレベーターがあるなど高齢者が疲れにくいルートを選ぶ。',
};

export async function POST(request: NextRequest) {
  const { from, to, priority } = await request.json();
  const priorityGuide = PRIORITY_GUIDES[priority] ?? '';

  const systemPrompt = `あなたは高齢者外出支援のコーディネーターアシスタントです。
Web検索を使って公共交通機関のルートを調べ、高齢者に適した形で提案してください。

優先方針：${priorityGuide}

出力フォーマット（JSONのみ）：
{
  "routes": [
    {
      "rank": 1,
      "label": "おすすめルート",
      "summary": "JR東海道線 → 豊橋駅 → バス15分",
      "steps": [
        { "type": "walk",  "desc": "自宅最寄り駅まで徒歩5分", "duration": "5分", "note": "平坦な道" },
        { "type": "train", "desc": "○○駅 → 豊橋駅（JR東海道線・普通）", "duration": "22分", "cost": "320円", "note": "6番線ホーム" },
        { "type": "bus",   "desc": "豊橋駅 → ○○バス停（豊鉄バス）", "duration": "15分", "cost": "200円", "note": "1番乗り場" },
        { "type": "walk",  "desc": "バス停から目的地まで徒歩3分", "duration": "3分", "note": "" }
      ],
      "total_time": "約45分",
      "total_cost": "520円",
      "rest_spots": ["豊橋駅 待合室（椅子あり）"],
      "elder_tips": "豊橋駅はエレベーター完備。バスは前ドア乗車で運転士に声をかけると安心。"
    }
  ],
  "caution": "ダイヤは変更になる場合があります。必ず乗車前に確認してください。"
}

必ずWeb検索を実行してから回答してください。JSONのみ出力してください。`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (client.messages.create as any)({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `出発地：${from}\n目的地：${to}\n優先条件：${priority}\n\n高齢者向けの公共交通ルートを2〜3パターン提案してください。`,
    }],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text: string = (response.content as any[]).find((b: any) => b.type === 'text')?.text ?? '{}';
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ routes: [], caution: text });
  }
}

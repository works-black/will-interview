import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { from, to, priority } = await request.json();

  const priorityGuide: Record<string, string> = {
    distance: "乗り換え回数が少なく歩く距離が短いルートを最優先。駅からの徒歩距離を必ず記載。",
    cost:     "交通費が最も安いルートを最優先。",
    time:     "所要時間が最も短いルートを最優先。特急・快速の活用を検討。",
    comfort:  "途中に休憩できる場所が多いルートを優先。階段が少なくエレベーターがあるルートを選ぶ。",
  };

  const systemPrompt = `あなたは高齢者外出支援のコーディネーターアシスタントです。
公共交通機関のルートを調べて提案してください。

優先方針：${priorityGuide[priority] ?? ""}

必ず以下のJSON形式のみで出力してください。他のテキストは一切出力しないでください：
{
  "routes": [
    {
      "rank": 1,
      "label": "おすすめルート",
      "summary": "JR → 豊橋駅 → バス",
      "steps": [
        {
          "type": "walk",
          "desc": "最寄り駅まで徒歩",
          "duration": "5分",
          "cost": "",
          "note": "平坦な道"
        },
        {
          "type": "train",
          "desc": "○○駅 → 豊橋駅（JR東海道線）",
          "duration": "22分",
          "cost": "320円",
          "note": "6番線ホーム"
        },
        {
          "type": "bus",
          "desc": "豊橋駅 → ○○バス停",
          "duration": "15分",
          "cost": "200円",
          "note": "1番乗り場"
        },
        {
          "type": "walk",
          "desc": "バス停から目的地まで",
          "duration": "3分",
          "cost": "",
          "note": ""
        }
      ],
      "total_time": "約45分",
      "total_cost": "520円",
      "rest_spots": ["豊橋駅 待合室（椅子あり）"],
      "elder_tips": "バスは前ドア乗車が便利です"
    }
  ],
  "caution": "ダイヤは変更になる場合があります。乗車前に必ずご確認ください。"
}

typeは walk/train/bus/subway/taxi のいずれかのみ使用してください。
routes は2〜3パターン提案してください。`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (client.messages.create as any)({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `出発地：${from}\n目的地：${to}\n優先条件：${priority}\n\n高齢者向けの公共交通ルートを提案してください。必ずJSON形式のみで返してください。`
      }]
    });

    // テキストブロックを取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks = (response.content as any[])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { type: string; text?: string }) => b.type === "text" ? b.text : "");
    const text = textBlocks.join("");

    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", text);
      return NextResponse.json({
        routes: [],
        caution: "ルート情報を取得できませんでした。再度お試しください。"
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("Route API parsed:", JSON.stringify(parsed, null, 2));
    return NextResponse.json(parsed);

  } catch (error) {
    console.error("Route API error:", error);
    return NextResponse.json({
      routes: [],
      caution: "ルート情報の取得中にエラーが発生しました。"
    });
  }
}

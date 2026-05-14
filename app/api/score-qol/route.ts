import Anthropic from '@anthropic-ai/sdk';
import type { Message, QolScores } from '@/lib/types';

const client = new Anthropic();

export async function POST(request: Request) {
  const { messages } = await request.json() as { messages: Message[] };

  const conversationText = messages
    .map((m) => `${m.role === 'user' ? '利用者' : 'AI'}: ${m.content}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: `あなたはQOL（生活の質）評価の専門家です。面談の会話内容を分析し、6つの軸それぞれを0〜100のスコアで評価してください。

評価軸：
- 外出意欲：外出したい気持ち、積極性
- 移動能力：実際に移動できる身体的能力
- 社会参加：他者との関わり、コミュニティへの参加
- 精神的健康：気持ちの安定、前向きさ、自己効力感
- 身体的健康：体の状態、痛み、体力
- 生活満足度：日常生活全体の満足度

必ず以下のJSON形式のみで返答してください（説明文不要）：
{"外出意欲": 数値, "移動能力": 数値, "社会参加": 数値, "精神的健康": 数値, "身体的健康": 数値, "生活満足度": 数値}`,
    messages: [
      {
        role: 'user',
        content: `以下の面談会話を分析してQOLスコアを算出してください：\n\n${conversationText}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[^}]+\}/);
  if (!jsonMatch) {
    return Response.json({ error: 'Failed to parse QOL scores' }, { status: 500 });
  }

  const scores = JSON.parse(jsonMatch[0]) as QolScores;
  return Response.json(scores);
}

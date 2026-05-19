'use client';

import { useState, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Keyword {
  text: string;
  type: 'activity' | 'location';
}

interface SearchResult {
  name: string;
  category: string;
  location: string;
  schedule: string;
  fee: string;
  contact: string;
  beginner_friendly: boolean;
  elder_friendly: boolean;
  note: string;
}

interface SearchResponse {
  results: SearchResult[];
  search_summary: string;
  suggestion: string;
}

interface RouteStep {
  type: 'walk' | 'train' | 'bus' | 'subway' | 'taxi';
  desc: string;
  duration: string;
  cost?: string;
  note: string;
}

interface Route {
  rank: number;
  label: string;
  summary: string;
  steps: RouteStep[];
  total_time: string;
  total_cost: string;
  rest_spots: string[];
  elder_tips: string;
}

interface RouteResponse {
  routes: Route[];
  caution: string;
}

type RoutePriority = 'distance' | 'cost' | 'time' | 'comfort';

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  '絵画・水彩画', '書道・習字', '陶芸・クラフト',
  '体操・ヨガ', 'ウォーキング・ハイキング',
  '音楽・コーラス', '茶道・華道', '料理教室',
  'パソコン・スマホ', '図書館・読書会', 'ボランティア',
  '温泉・銭湯', '公園・植物園', 'その他',
];

const PRIORITY_OPTIONS: { value: RoutePriority; label: string }[] = [
  { value: 'distance', label: '🚶 歩く距離が少ない' },
  { value: 'cost',     label: '💴 交通費が安い' },
  { value: 'time',     label: '⏱ 時間が短い' },
  { value: 'comfort',  label: '🌿 疲れにくい（休憩多め）' },
];

const STEP_ICONS: Record<string, string> = {
  walk: '🚶', train: '🚃', bus: '🚌', subway: '🚇', taxi: '🚕',
};

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  defaultLocation?: string;
  conversationMessages?: { role: string; content: string }[];
}

// ── Component ────────────────────────────────────────────────────────────────

export default function InfoSearch({ defaultLocation = '', conversationMessages }: Props) {
  // Search state
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Keyword extraction state
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  // Route state
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [routeFrom, setRouteFrom] = useState('');
  const [routePriority, setRoutePriority] = useState<RoutePriority>('comfort');
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  // Auto-extract keywords when conversation messages are provided
  useEffect(() => {
    if (conversationMessages && conversationMessages.length > 0) {
      extractKeywords();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractKeywords = async () => {
    if (!conversationMessages || conversationMessages.length === 0) return;
    setKeywordsLoading(true);
    try {
      const res = await fetch('/api/extract-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationMessages }),
      });
      if (!res.ok) throw new Error('Extraction failed');
      const data: { keywords: Keyword[] } = await res.json();
      setKeywords(data.keywords ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setKeywordsLoading(false);
    }
  };

  const handleKeywordClick = (kw: Keyword) => {
    const next = new Set(selectedKeywords);
    if (next.has(kw.text)) {
      next.delete(kw.text);
    } else {
      next.add(kw.text);
      if (kw.type === 'location') setLocation(kw.text);
      else setQuery(kw.text);
    }
    setSelectedKeywords(next);
  };

  const handleSearch = async () => {
    if (!query.trim() || !location.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, category }),
      });
      if (!res.ok) throw new Error('Search failed');
      const data: SearchResponse = await res.json();
      setResults(data);
      setSelectedResult(null);
      setRouteResult(null);
    } catch (e) {
      console.error(e);
      setError('情報を取得できませんでした。再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSearch = async () => {
    if (!routeFrom.trim() || !selectedResult) return;
    setRouteLoading(true);
    setRouteError('');
    try {
      const res = await fetch('/api/route-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: routeFrom,
          to: selectedResult.name + (selectedResult.location ? `（${selectedResult.location}）` : ''),
          priority: routePriority,
        }),
      });
      if (!res.ok) throw new Error('Route search failed');
      const data: RouteResponse = await res.json();
      setRouteResult(data);
    } catch (e) {
      console.error(e);
      setRouteError('情報を取得できませんでした。再度お試しください。');
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* ── Section 1: Keyword Tags ── */}
      {conversationMessages && conversationMessages.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">会話から抽出したキーワード</h3>
            <button
              onClick={extractKeywords}
              disabled={keywordsLoading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center gap-1"
            >
              {keywordsLoading ? (
                <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
              ) : '🔄'}
              会話から再抽出
            </button>
          </div>

          {keywordsLoading && keywords.length === 0 && (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              キーワードを抽出中...
            </div>
          )}

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => {
                const selected = selectedKeywords.has(kw.text);
                const isLocation = kw.type === 'location';
                return (
                  <button
                    key={kw.text}
                    onClick={() => handleKeywordClick(kw)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selected
                        ? isLocation
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-green-600 text-white border-green-600'
                        : isLocation
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400'
                        : 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
                    }`}
                  >
                    {isLocation ? '📍' : '🎯'} {kw.text}
                  </button>
                );
              })}
            </div>
          )}

          {!keywordsLoading && keywords.length === 0 && (
            <p className="text-sm text-gray-400">「再抽出」ボタンで面談会話からキーワードを取得します</p>
          )}

          <p className="text-xs text-gray-400 mt-2">
            📍青＝場所（エリア欄に入力）　🎯緑＝活動（キーワード欄に入力）　タップで選択
          </p>
        </div>
      )}

      {/* ── Section 2: Search Form + Results ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-xl font-bold text-gray-800 mb-1">🔍 地域情報検索</h2>
        <p className="text-sm text-gray-500 mb-4">利用者の興味に合った地域の活動・施設を検索します</p>

        <div className="space-y-4 mb-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              エリア（市区町村） <span className="text-red-400">*</span>
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：豊橋市、浜松市北区"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              やりたいこと・キーワード <span className="text-red-400">*</span>
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例：水彩画の屋外講座、桜を見ながら散歩"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-2">カテゴリ（任意）</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(category === c ? '' : c)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    category === c
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim() || !location.trim()}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                検索中...
              </span>
            ) : '🔍 地域情報を検索する'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-4 mt-4">
            {results.search_summary && (
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 leading-relaxed">
                {results.search_summary}
              </div>
            )}

            {results.results.length === 0 && (
              <p className="text-center text-gray-400 py-4">
                検索結果が見つかりませんでした。キーワードを変えて試してください。
              </p>
            )}

            {results.results.map((r, i) => (
              <div
                key={i}
                className={`border-2 rounded-xl p-4 transition-shadow ${
                  selectedResult?.name === r.name
                    ? 'border-blue-400 shadow-md'
                    : 'border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-800 text-base leading-snug">{r.name}</h3>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    {r.elder_friendly && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                        高齢者歓迎
                      </span>
                    )}
                    {r.beginner_friendly && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                        初心者OK
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                  {r.location && <div className="flex items-start gap-1"><span>📍</span><span>{r.location}</span></div>}
                  {r.schedule && <div className="flex items-start gap-1"><span>📅</span><span>{r.schedule}</span></div>}
                  {r.fee && <div className="flex items-start gap-1"><span>💴</span><span>{r.fee}</span></div>}
                  {r.contact && (
                    <div className="flex items-start gap-1 col-span-2">
                      <span>📞</span><span className="break-all">{r.contact}</span>
                    </div>
                  )}
                </div>
                {r.note && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                    💡 {r.note}
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedResult(r);
                    setRouteResult(null);
                    setRouteError('');
                    setTimeout(() => {
                      document.getElementById('route-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full py-2.5 bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  🗺️ ここへの行き方を調べる
                </button>
              </div>
            ))}

            {results.results.length > 0 && (
              <p className="text-xs text-gray-400 text-center pt-1">
                ※ 掲載情報は変更になる場合があります。最新情報はお電話でご確認ください。
              </p>
            )}

            {results.suggestion && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
                <strong className="block mb-1">コーディネーターへ：</strong>
                {results.suggestion}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Section 3: Route Suggestion ── */}
      {selectedResult && (
        <div id="route-section" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🗺️ 行き方を調べる</h2>

          <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-blue-500 font-semibold mb-0.5">目的地</p>
            <p className="text-base font-bold text-blue-800">{selectedResult.name}</p>
            {selectedResult.location && (
              <p className="text-sm text-blue-600 mt-0.5">📍 {selectedResult.location}</p>
            )}
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="text-sm font-semibold text-gray-600 block mb-1">
                出発地（自宅最寄り駅など）
              </label>
              <input
                value={routeFrom}
                onChange={(e) => setRouteFrom(e.target.value)}
                placeholder="例：○○駅、△△バス停"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 block mb-2">優先条件を選択</label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRoutePriority(opt.value)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                      routePriority === opt.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRouteSearch}
              disabled={routeLoading || !routeFrom.trim()}
              className="w-full py-4 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl text-lg disabled:opacity-50 transition-colors"
            >
              {routeLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ルートを検索中...
                </span>
              ) : '🗺️ 行き方を調べる'}
            </button>
          </div>

          {routeError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">
              {routeError}
            </div>
          )}

          {routeResult && (
            <div className="space-y-4">
              {routeResult.routes.map((route, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                    <span className="text-xl">{RANK_MEDALS[i] ?? '▶'}</span>
                    <div>
                      <p className="font-bold text-gray-800">{route.label}</p>
                      <p className="text-sm text-gray-500">{route.summary}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-semibold text-gray-700">⏱ {route.total_time}</p>
                      <p className="text-sm text-gray-500">💴 {route.total_cost}</p>
                    </div>
                  </div>

                  <div className="px-4 py-3 space-y-2">
                    {route.steps.map((step, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <span className="text-lg shrink-0 mt-0.5">{STEP_ICONS[step.type] ?? '▶'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-700">[{step.duration}]</span>
                            <span className="text-sm text-gray-800">{step.desc}</span>
                            {step.cost && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {step.cost}
                              </span>
                            )}
                          </div>
                          {step.note && (
                            <p className="text-xs text-gray-400 mt-0.5">{step.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {(route.rest_spots?.length > 0 || route.elder_tips) && (
                    <div className="px-4 pb-3 space-y-1.5">
                      {route.rest_spots?.length > 0 && (
                        <div className="bg-green-50 rounded-lg px-3 py-2 text-sm text-green-800">
                          🪑 休憩スポット：{route.rest_spots.join('、')}
                        </div>
                      )}
                      {route.elder_tips && (
                        <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800">
                          👴 コツ：{route.elder_tips}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {routeResult.caution && (
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
                  <span className="shrink-0">⚠️</span>
                  <span>{routeResult.caution}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

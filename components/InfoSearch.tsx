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

const PRIORITIES = [
  { key: 'comfort'  as const, label: '🌿 疲れにくい',    sub: '休憩スポット多め' },
  { key: 'distance' as const, label: '🚶 歩く距離少なめ', sub: '乗り換えも少なく' },
  { key: 'cost'     as const, label: '💴 交通費を節約',   sub: '最安ルート' },
  { key: 'time'     as const, label: '⏱ 時間を短く',     sub: '特急・快速優先' },
];

const STEP_ICON: Record<string, string> = {
  walk: '🚶', train: '🚃', bus: '🚌', subway: '🚇', taxi: '🚕',
};
const STEP_COLOR: Record<string, string> = {
  walk: '#6b7280', train: '#1a4a8a', bus: '#d97706', subway: '#7c3aed', taxi: '#dc2626',
};
const STEP_BG: Record<string, string> = {
  walk: '#f3f4f6', train: '#eff6ff', bus: '#fffbeb', subway: '#faf5ff', taxi: '#fff5f5',
};
const STEP_LABEL: Record<string, string> = {
  walk: '🚶 徒歩', train: '🚃 電車', bus: '🚌 バス', subway: '🚇 地下鉄', taxi: '🚕 タクシー',
};
const RANK_COLORS = ['#1a4a8a', '#2d6047', '#7c3aed'];
const RANK_LABELS = ['🥇 おすすめ', '🥈 別ルート', '🥉 別ルート'];

// ── RouteCard ─────────────────────────────────────────────────────────────────

function RouteCard({ route, index }: { route: Route; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const color = RANK_COLORS[index] ?? '#555';
  const rankLabel = RANK_LABELS[index] ?? `ルート${index + 1}`;

  return (
    <div style={{ border: `2px solid ${color}`, borderRadius: 16, overflow: 'hidden', fontSize: 18 }}>

      {/* ── Header (toggle button) ── */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: color, color: '#fff',
          padding: '14px 18px', border: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{rankLabel}</div>
          <div style={{ opacity: 0.9, fontSize: 14, marginTop: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {route.summary}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 15, whiteSpace: 'nowrap' }}>
            ⏱ {route.total_time}
          </span>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 15, whiteSpace: 'nowrap' }}>
            💴 {route.total_cost}
          </span>
          <span style={{ fontSize: 18 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '16px 18px', background: '#fff' }}>

          {/* ── Horizontal timeline ── */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', marginBottom: 16, overflowX: 'auto' }}>
            {route.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', minWidth: 72 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: STEP_COLOR[step.type] ?? '#555',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, margin: '0 auto 4px',
                  }}>
                    {STEP_ICON[step.type] ?? '🔹'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: STEP_COLOR[step.type] ?? '#555' }}>
                    {step.duration}
                  </div>
                  {step.cost && (
                    <div style={{ fontSize: 12, color: '#888' }}>{step.cost}</div>
                  )}
                </div>
                {i < route.steps.length - 1 && (
                  <div style={{ flex: 1, minWidth: 24, height: 3, background: '#e5e7eb', margin: '0 4px' }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Step detail list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {route.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: STEP_BG[step.type] ?? '#f9fafb',
                borderRadius: 10, padding: '12px 14px',
                borderLeft: `4px solid ${STEP_COLOR[step.type] ?? '#ccc'}`,
              }}>
                <div style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>
                  {STEP_ICON[step.type] ?? '🔹'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 17, color: STEP_COLOR[step.type] ?? '#333' }}>
                      {STEP_LABEL[step.type] ?? step.type}　{step.duration}
                    </span>
                    {step.cost && (
                      <span style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '2px 10px', fontSize: 15, color: '#374151' }}>
                        💴 {step.cost}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 16, color: '#374151', marginTop: 4 }}>{step.desc}</div>
                  {step.note && (
                    <div style={{ fontSize: 14, color: '#6b7280', marginTop: 3 }}>💡 {step.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Rest spots ── */}
          {route.rest_spots?.length > 0 && (
            <div style={{ marginTop: 14, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: 16, marginBottom: 6 }}>
                🪑 途中の休憩スポット
              </div>
              {route.rest_spots.map((spot, i) => (
                <div key={i} style={{ fontSize: 16, color: '#166534', padding: '2px 0' }}>・{spot}</div>
              ))}
            </div>
          )}

          {/* ── Elder tips ── */}
          {route.elder_tips && (
            <div style={{ marginTop: 10, padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: 16, marginBottom: 4 }}>
                👴 コーディネーターへのポイント
              </div>
              <div style={{ fontSize: 16, color: '#78350f' }}>{route.elder_tips}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  defaultLocation?: string;
  conversationMessages?: { role: string; content: string }[];
}

// ── Main Component ────────────────────────────────────────────────────────────

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
              {keywordsLoading
                ? <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                : '🔄'}
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
                        ? isLocation ? 'bg-blue-600 text-white border-blue-600' : 'bg-green-600 text-white border-green-600'
                        : isLocation ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400' : 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">{error}</div>
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
                  selectedResult?.name === r.name ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-800 text-base leading-snug">{r.name}</h3>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    {r.elder_friendly && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">高齢者歓迎</span>
                    )}
                    {r.beginner_friendly && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">初心者OK</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                  {r.location && <div className="flex items-start gap-1"><span>📍</span><span>{r.location}</span></div>}
                  {r.schedule && <div className="flex items-start gap-1"><span>📅</span><span>{r.schedule}</span></div>}
                  {r.fee && <div className="flex items-start gap-1"><span>💴</span><span>{r.fee}</span></div>}
                  {r.contact && <div className="flex items-start gap-1 col-span-2"><span>📞</span><span className="break-all">{r.contact}</span></div>}
                </div>
                {r.note && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">💡 {r.note}</div>
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

          {/* Destination badge */}
          <div style={{ background: '#eff6ff', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 700, marginBottom: 2 }}>📍 目的地</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a8a' }}>{selectedResult.name}</div>
            {selectedResult.location && (
              <div style={{ fontSize: 15, color: '#3b82f6', marginTop: 2 }}>📍 {selectedResult.location}</div>
            )}
          </div>

          {/* From input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 6 }}>
              出発地（自宅最寄り駅など）
            </label>
            <input
              value={routeFrom}
              onChange={(e) => setRouteFrom(e.target.value)}
              placeholder="例：○○駅、△△バス停"
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #d1d5db', borderRadius: 12, fontSize: 17, boxSizing: 'border-box', outline: 'none' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>

          {/* Priority buttons */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>優先条件を選択</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PRIORITIES.map((pr) => (
                <button
                  key={pr.key}
                  onClick={() => setRoutePriority(pr.key)}
                  style={{
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    border: routePriority === pr.key ? '2px solid #1a4a8a' : '2px solid #e5e7eb',
                    background: routePriority === pr.key ? '#eff6ff' : '#fff',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 17, color: routePriority === pr.key ? '#1a4a8a' : '#374151' }}>
                    {pr.label}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{pr.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={handleRouteSearch}
            disabled={routeLoading || !routeFrom.trim()}
            style={{
              width: '100%', padding: '16px', background: routeLoading || !routeFrom.trim() ? '#9ca3af' : '#1e3a8a',
              color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 12,
              border: 'none', cursor: routeLoading || !routeFrom.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 16, transition: 'background 0.15s',
            }}
          >
            {routeLoading ? (
              <>
                <span style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                ルートを検索中...
              </>
            ) : '🗺️ 行き方を調べる'}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {routeError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 16, marginBottom: 16 }}>
              {routeError}
            </div>
          )}

          {/* Route cards */}
          {routeResult && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {routeResult.routes.map((route, i) => (
                  <RouteCard key={i} route={route} index={i} />
                ))}
              </div>

              {routeResult.caution && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: '#92400e' }}>
                  <span style={{ flexShrink: 0, fontSize: 20 }}>⚠️</span>
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

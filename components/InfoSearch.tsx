'use client';

import { useState } from 'react';

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

interface Props {
  defaultLocation?: string;
  initialQuery?: string;
}

const CATEGORIES = [
  '絵画・水彩画', '書道・習字', '陶芸・クラフト',
  '体操・ヨガ', 'ウォーキング・ハイキング',
  '音楽・コーラス', '茶道・華道', '料理教室',
  'パソコン・スマホ', '図書館・読書会', 'ボランティア',
  '温泉・銭湯', '公園・植物園', 'その他',
];

export default function InfoSearch({ defaultLocation = '', initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(defaultLocation);
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query || !location) return;
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
    } catch (e) {
      console.error(e);
      setError('検索に失敗しました。再試行してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
        🔍 地域情報検索
      </h2>
      <p className="text-sm text-gray-500 mb-5">利用者の興味に合った地域の活動・施設を検索します</p>

      <div className="space-y-4 mb-5">
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
          <label className="text-sm font-semibold text-gray-600 block mb-2">
            カテゴリ（任意）
          </label>
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
          {loading ? '🔍 検索中...' : '🔍 地域情報を検索する'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {results.search_summary && (
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 leading-relaxed">
              {results.search_summary}
            </div>
          )}

          {results.results.length === 0 && (
            <p className="text-center text-gray-400 py-4">検索結果が見つかりませんでした。キーワードを変えて試してください。</p>
          )}

          {results.results.map((r, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
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
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                {r.location && <div className="flex items-start gap-1"><span>📍</span><span>{r.location}</span></div>}
                {r.schedule && <div className="flex items-start gap-1"><span>📅</span><span>{r.schedule}</span></div>}
                {r.fee && <div className="flex items-start gap-1"><span>💴</span><span>{r.fee}</span></div>}
                {r.contact && <div className="flex items-start gap-1 col-span-2"><span>📞</span><span className="break-all">{r.contact}</span></div>}
              </div>
              {r.note && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  💡 {r.note}
                </div>
              )}
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
  );
}

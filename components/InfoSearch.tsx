"use client";
import { useState, useEffect } from "react";

// ── 型定義 ──────────────────────────────────────
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
interface SearchHistory {
  id: string;
  query: string;
  location: string;
  searchedAt: string;
  data: SearchResponse;
}
interface Step {
  type: "walk" | "train" | "bus" | "subway" | "taxi";
  desc: string;
  duration: string;
  cost?: string;
  note?: string;
}
interface Route {
  rank: number;
  label: string;
  summary: string;
  steps: Step[];
  total_time: string;
  total_cost: string;
  rest_spots: string[];
  elder_tips: string;
}
interface RouteResponse {
  routes: Route[];
  caution: string;
}
interface Keyword {
  text: string;
  type: "location" | "activity";
}

const STORAGE_KEY = "will_search_history";

// ── RouteCard（InfoSearchの外に定義）────────────
const RouteCard = ({ route, index }: { route: Route; index: number }) => {
  const [open, setOpen] = useState(index === 0);

  const rankColors = ["#1a4a8a", "#2d6047", "#7c3aed"];
  const rankLabels = ["🥇 おすすめ", "🥈 別ルート", "🥉 別ルート"];
  const color = rankColors[index] ?? "#555";

  const stepIcon: Record<string, string> = {
    walk: "🚶", train: "🚃", bus: "🚌", subway: "🚇", taxi: "🚕",
  };
  const stepColor: Record<string, string> = {
    walk: "#6b7280", train: "#1a4a8a", bus: "#d97706",
    subway: "#7c3aed", taxi: "#dc2626",
  };
  const stepBg: Record<string, string> = {
    walk: "#f3f4f6", train: "#eff6ff", bus: "#fffbeb",
    subway: "#faf5ff", taxi: "#fff5f5",
  };

  return (
    <div style={{
      border: `2px solid ${color}`, borderRadius: 16,
      overflow: "hidden", marginBottom: 16, fontSize: 16,
    }}>
      {/* ヘッダー */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          background: color, color: "#fff", padding: "14px 18px",
          border: "none", display: "flex",
          justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            {rankLabels[index] ?? `ルート${index + 1}`}
          </span>
          <span style={{ marginLeft: 12, opacity: 0.85, fontSize: 15 }}>
            {route.summary}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{
            background: "rgba(255,255,255,0.2)", borderRadius: 20,
            padding: "4px 12px", fontSize: 15,
          }}>⏱ {route.total_time}</span>
          <span style={{
            background: "rgba(255,255,255,0.2)", borderRadius: 20,
            padding: "4px 12px", fontSize: 15,
          }}>💴 {route.total_cost}</span>
          <span style={{ fontSize: 18 }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "16px 18px", background: "#fff" }}>

          {/* 横タイムライン */}
          <div style={{
            display: "flex", alignItems: "center",
            padding: "12px 0", marginBottom: 16, overflowX: "auto",
          }}>
            {route.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center", minWidth: 68 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: stepColor[step.type] ?? "#555",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 20, margin: "0 auto 4px",
                  }}>
                    {stepIcon[step.type] ?? "🔹"}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: stepColor[step.type] ?? "#555",
                  }}>{step.duration}</div>
                  {step.cost && (
                    <div style={{ fontSize: 12, color: "#888" }}>{step.cost}</div>
                  )}
                </div>
                {i < route.steps.length - 1 && (
                  <div style={{
                    flex: 1, minWidth: 20, height: 3,
                    background: "#e5e7eb", margin: "0 4px",
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* 詳細ステップ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {route.steps.map((step, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                background: stepBg[step.type] ?? "#f9fafb",
                borderRadius: 10, padding: "12px 14px",
                borderLeft: `4px solid ${stepColor[step.type] ?? "#ccc"}`,
              }}>
                <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>
                  {stepIcon[step.type] ?? "🔹"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", flexWrap: "wrap", gap: 4,
                  }}>
                    <span style={{
                      fontWeight: 700, fontSize: 16,
                      color: stepColor[step.type] ?? "#333",
                    }}>
                      {step.type === "walk" ? "🚶 徒歩"
                        : step.type === "train" ? "🚃 電車"
                        : step.type === "bus" ? "🚌 バス"
                        : step.type === "subway" ? "🚇 地下鉄"
                        : "🚕 タクシー"}
                      　{step.duration}
                    </span>
                    {step.cost && (
                      <span style={{
                        background: "#fff", border: "1px solid #e5e7eb",
                        borderRadius: 12, padding: "2px 10px",
                        fontSize: 14, color: "#374151",
                      }}>💴 {step.cost}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 15, color: "#374151", marginTop: 4 }}>
                    {step.desc}
                  </div>
                  {step.note && (
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>
                      💡 {step.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 休憩スポット */}
          {route.rest_spots && route.rest_spots.length > 0 && (
            <div style={{
              marginTop: 14, padding: "12px 16px",
              background: "#f0fdf4", borderRadius: 10,
              border: "1px solid #bbf7d0",
            }}>
              <div style={{
                fontWeight: 700, color: "#15803d", fontSize: 15, marginBottom: 6,
              }}>🪑 途中の休憩スポット</div>
              {route.rest_spots.map((spot, i) => (
                <div key={i} style={{ fontSize: 15, color: "#166534", padding: "2px 0" }}>
                  ・{spot}
                </div>
              ))}
            </div>
          )}

          {/* 高齢者向けコツ */}
          {route.elder_tips && (
            <div style={{
              marginTop: 10, padding: "12px 16px",
              background: "#fffbeb", borderRadius: 10,
              border: "1px solid #fde68a",
            }}>
              <div style={{
                fontWeight: 700, color: "#92400e", fontSize: 15, marginBottom: 4,
              }}>👴 コーディネーターへのポイント</div>
              <div style={{ fontSize: 15, color: "#78350f" }}>
                {route.elder_tips}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── TagInput（InfoSearchの外に定義）─────────────
const TagInput = ({
  tags, input, onInputChange, onAddTag, onRemoveTag,
  placeholder, color, inputId,
}: {
  tags: string[];
  input: string;
  onInputChange: (v: string) => void;
  onAddTag: (v: string) => void;
  onRemoveTag: (i: number) => void;
  placeholder: string;
  color: string;
  inputId: string;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      onAddTag(input.trim());
      onInputChange("");
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onRemoveTag(tags.length - 1);
    }
  };

  return (
    <div
      style={{
        display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
        border: "1px solid #d1d5db", borderRadius: 12,
        padding: "8px 12px", background: "#fff",
        minHeight: 52, cursor: "text",
      }}
      onClick={() => document.getElementById(inputId)?.focus()}
    >
      {tags.map((tag, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: color, color: "#fff",
          borderRadius: 20, padding: "4px 12px",
          fontSize: 15, fontWeight: 600,
        }}>
          {tag}
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveTag(i); }}
            style={{
              background: "rgba(255,255,255,0.3)", border: "none",
              borderRadius: "50%", width: 18, height: 18,
              cursor: "pointer", color: "#fff", fontSize: 11,
              display: "flex", alignItems: "center",
              justifyContent: "center", padding: 0,
            }}
          >✕</button>
        </span>
      ))}
      <input
        id={inputId}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) { onAddTag(input.trim()); onInputChange(""); }
        }}
        placeholder={tags.length === 0 ? placeholder : "追加..."}
        style={{
          border: "none", outline: "none",
          fontSize: 16, flex: 1, minWidth: 80, background: "transparent",
        }}
      />
    </div>
  );
};

// ── メインコンポーネント ─────────────────────────
interface Props {
  defaultLocation?: string;
  conversationMessages?: { role: string; content: string }[];
}

const PRIORITIES = [
  { key: "comfort",  label: "🌿 疲れにくい",    sub: "休憩スポット多め" },
  { key: "distance", label: "🚶 歩く距離少なめ", sub: "乗り換えも少なく" },
  { key: "cost",     label: "💴 交通費を節約",   sub: "最安ルート" },
  { key: "time",     label: "⏱ 時間を短く",     sub: "特急・快速優先" },
] as const;

const CATEGORIES = [
  "絵画・水彩画","書道・習字","陶芸・クラフト","体操・ヨガ",
  "ウォーキング","音楽・コーラス","茶道・華道","料理教室",
  "パソコン","図書館・読書会","ボランティア","温泉・銭湯",
  "公園・植物園","その他",
];

export default function InfoSearch({
  defaultLocation = "",
  conversationMessages = [],
}: Props) {
  // ── 検索フォーム
  const [locationTags, setLocationTags] = useState<string[]>(
    defaultLocation ? [defaultLocation] : []
  );
  const [locationInput, setLocationInput] = useState("");
  const [queryTags, setQueryTags] = useState<string[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // ── 検索履歴
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // ── キーワード抽出
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [kwLoading, setKwLoading] = useState(false);

  // ── ルート
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [routeFrom, setRouteFrom] = useState("");
  const [routePriority, setRoutePriority] =
    useState<"distance" | "cost" | "time" | "comfort">("comfort");
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // ── localStorage から履歴を読み込む
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setSearchHistory(JSON.parse(saved)); } catch {}
    }
  }, []);

  // ── 会話からキーワード自動抽出
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (conversationMessages.length > 0) extractKeywords();
  }, [conversationMessages.length]);

  const saveHistory = (newHistory: SearchHistory[]) => {
    setSearchHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const extractKeywords = async () => {
    if (conversationMessages.length === 0) return;
    setKwLoading(true);
    try {
      const res = await fetch("/api/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationMessages }),
      });
      const data = await res.json();
      setKeywords(data.keywords ?? []);
    } catch {}
    finally { setKwLoading(false); }
  };

  const handleSearch = async () => {
    const qStr = [...queryTags, queryInput.trim()].filter(Boolean).join(" ");
    const lStr = [...locationTags, locationInput.trim()].filter(Boolean).join(" ");
    if (!qStr || !lStr) return;

    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: qStr, location: lStr, category }),
      });
      const data: SearchResponse = await res.json();

      const newEntry: SearchHistory = {
        id: Date.now().toString(),
        query: qStr,
        location: lStr,
        searchedAt: new Date().toLocaleString("ja-JP", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        }),
        data,
      };
      saveHistory([newEntry, ...searchHistory]);
    } catch {}
    finally { setLoading(false); }
  };

  const handleRouteSearch = async () => {
    if (!selectedResult || !routeFrom) return;
    setRouteLoading(true);
    try {
      const res = await fetch("/api/route-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: routeFrom,
          to: selectedResult.name + " " + selectedResult.location,
          priority: routePriority,
        }),
      });
      const data: RouteResponse = await res.json();
      console.log("Route API response:", JSON.stringify(data, null, 2));
      setRouteResult(data);
    } catch {}
    finally { setRouteLoading(false); }
  };

  const selectResult = (r: SearchResult) => {
    setSelectedResult(r);
    setRouteResult(null);
    setTimeout(() => {
      document.getElementById("route-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 40px", fontSize: 16 }}>

      {/* ━━━━━ セクション① キーワードタグ ━━━━━ */}
      <div style={{
        background: "#f0f4ff", borderRadius: 14, padding: "14px 16px",
        marginBottom: 20, border: "1px solid #c7d7f9",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 10,
        }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e3a8a" }}>
            💬 会話から抽出したキーワード
          </span>
          <button
            onClick={extractKeywords}
            disabled={kwLoading}
            style={{
              background: "#1a4a8a", color: "#fff", border: "none",
              borderRadius: 8, padding: "6px 14px",
              fontSize: 14, cursor: "pointer",
            }}
          >
            {kwLoading ? "抽出中..." : "🔄 再抽出"}
          </button>
        </div>
        {keywords.length === 0 ? (
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            面談の会話が増えると自動でキーワードが表示されます
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {keywords.map((kw, i) => (
              <button
                key={i}
                onClick={() => {
                  if (kw.type === "location") {
                    setLocationTags(prev =>
                      prev.includes(kw.text) ? prev : [...prev, kw.text]);
                  } else {
                    setQueryTags(prev =>
                      prev.includes(kw.text) ? prev : [...prev, kw.text]);
                  }
                }}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 15,
                  fontWeight: 600, cursor: "pointer", border: "none",
                  background: kw.type === "location" ? "#1a4a8a" : "#2d6047",
                  color: "#fff",
                }}
              >
                {kw.type === "location" ? "📍" : "🎨"} {kw.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ━━━━━ セクション② 検索フォーム ━━━━━ */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: "16px",
        border: "1px solid #e5e7eb", marginBottom: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            📍 エリア（Enterで追加・複数可）
          </label>
          <TagInput
            tags={locationTags}
            input={locationInput}
            onInputChange={setLocationInput}
            onAddTag={(v) => setLocationTags(prev =>
              prev.includes(v) ? prev : [...prev, v])}
            onRemoveTag={(i) => setLocationTags(prev =>
              prev.filter((_, idx) => idx !== i))}
            placeholder="例：豊橋市（Enterで確定）"
            color="#1a4a8a"
            inputId="location-input"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            🎯 やりたいこと・キーワード（Enterで追加・複数可）
          </label>
          <TagInput
            tags={queryTags}
            input={queryInput}
            onInputChange={setQueryInput}
            onAddTag={(v) => setQueryTags(prev =>
              prev.includes(v) ? prev : [...prev, v])}
            onRemoveTag={(i) => setQueryTags(prev =>
              prev.filter((_, idx) => idx !== i))}
            placeholder="例：水彩画 屋外講座（Enterで確定）"
            color="#2d6047"
            inputId="query-input"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            カテゴリ（任意）
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(category === c ? "" : c)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 14,
                  cursor: "pointer", border: "1px solid",
                  borderColor: category === c ? "#1a4a8a" : "#d1d5db",
                  background: category === c ? "#1a4a8a" : "#f9fafb",
                  color: category === c ? "#fff" : "#374151",
                }}
              >{c}</button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={
            loading ||
            (queryTags.length === 0 && !queryInput.trim()) ||
            (locationTags.length === 0 && !locationInput.trim())
          }
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: "#1a4a8a", color: "#fff", border: "none",
            fontSize: 18, fontWeight: 700, cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "🔍 検索中..." : "🔍 地域情報を検索する"}
        </button>
      </div>

      {/* ━━━━━ セクション③ 検索履歴 ━━━━━ */}
      {searchHistory.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 12,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", margin: 0 }}>
              📋 検索履歴（{searchHistory.length}件）
            </h3>
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setSearchHistory([]);
              }}
              style={{
                fontSize: 14, color: "#ef4444", background: "none",
                border: "1px solid #fca5a5", borderRadius: 8,
                padding: "4px 12px", cursor: "pointer",
              }}
            >🗑 履歴をクリア</button>
          </div>

          {searchHistory.map((entry) => (
            <div key={entry.id} style={{
              border: "1px solid #e5e7eb", borderRadius: 12,
              marginBottom: 14, overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div style={{
                background: "#f8fafc", padding: "10px 16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex", justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#374151" }}>
                  🔍 {entry.location} × {entry.query}
                </span>
                <span style={{ fontSize: 13, color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>
                  {entry.searchedAt}
                </span>
              </div>

              {entry.data.results.map((r, i) => (
                <div key={i} style={{
                  padding: "12px 16px",
                  borderBottom: i < entry.data.results.length - 1
                    ? "1px solid #f3f4f6" : "none",
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", gap: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, color: "#111827" }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
                      {[r.location, r.schedule, r.fee].filter(Boolean).join("　")}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      {r.elder_friendly && (
                        <span style={{
                          background: "#dcfce7", color: "#15803d",
                          fontSize: 12, padding: "2px 8px", borderRadius: 10,
                        }}>高齢者歓迎</span>
                      )}
                      {r.beginner_friendly && (
                        <span style={{
                          background: "#fef9c3", color: "#854d0e",
                          fontSize: 12, padding: "2px 8px", borderRadius: 10,
                        }}>初心者OK</span>
                      )}
                    </div>
                    {r.note && (
                      <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                        💡 {r.note}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => selectResult(r)}
                    style={{
                      flexShrink: 0, background: "#1a4a8a", color: "#fff",
                      border: "none", borderRadius: 8,
                      padding: "8px 14px", fontSize: 14,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >🗺 行き方</button>
                </div>
              ))}

              {entry.data.search_summary && (
                <div style={{
                  padding: "8px 16px", background: "#f0f9ff",
                  fontSize: 13, color: "#0369a1",
                  borderTop: "1px solid #e0f2fe",
                }}>
                  {entry.data.search_summary}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ━━━━━ セクション④ ルート提案 ━━━━━ */}
      <div id="route-section" style={{
        background: "#fff", borderRadius: 14, padding: "16px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginTop: 0, marginBottom: 14 }}>
          🗺 行き方を調べる
        </h3>

        {selectedResult ? (
          <div style={{
            background: "#eff6ff", borderRadius: 10, padding: "10px 14px",
            marginBottom: 14, fontSize: 15, color: "#1e3a8a", fontWeight: 600,
          }}>
            📍 目的地：{selectedResult.name}
            {selectedResult.location && (
              <span style={{ fontWeight: 400, marginLeft: 8, color: "#3b82f6" }}>
                {selectedResult.location}
              </span>
            )}
          </div>
        ) : (
          <div style={{
            background: "#f9fafb", borderRadius: 10, padding: "10px 14px",
            marginBottom: 14, fontSize: 14, color: "#9ca3af",
          }}>
            ↑ 検索履歴の「🗺 行き方」ボタンを押すと目的地が設定されます
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            🚉 出発地（自宅最寄り駅など）
          </label>
          <input
            value={routeFrom}
            onChange={(e) => setRouteFrom(e.target.value)}
            placeholder="例：豊橋駅、二川駅"
            style={{
              width: "100%", padding: "10px 14px",
              border: "1px solid #d1d5db", borderRadius: 10,
              fontSize: 16, boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 15, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
            優先条件
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PRIORITIES.map((pr) => (
              <button
                key={pr.key}
                onClick={() => setRoutePriority(pr.key)}
                style={{
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  border: `2px solid ${routePriority === pr.key ? "#1a4a8a" : "#e5e7eb"}`,
                  background: routePriority === pr.key ? "#eff6ff" : "#fff",
                  textAlign: "left", transition: "all 0.15s",
                }}
              >
                <div style={{
                  fontWeight: 700, fontSize: 16,
                  color: routePriority === pr.key ? "#1a4a8a" : "#374151",
                }}>{pr.label}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                  {pr.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRouteSearch}
          disabled={routeLoading || !selectedResult || !routeFrom}
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: "#2d6047", color: "#fff", border: "none",
            fontSize: 18, fontWeight: 700, cursor: "pointer",
            opacity: routeLoading || !selectedResult || !routeFrom ? 0.5 : 1,
            marginBottom: 16,
          }}
        >
          {routeLoading ? "🗺 ルート検索中..." : "🗺 行き方を調べる"}
        </button>

        {routeResult && (
          <div>
            {routeResult.routes.map((route, i) => (
              <RouteCard key={i} route={route} index={i} />
            ))}
            {routeResult.caution && (
              <div style={{
                marginTop: 8, padding: "10px 14px",
                background: "#fef9c3", borderRadius: 10,
                fontSize: 14, color: "#713f12",
                border: "1px solid #fde047",
              }}>⚠️ {routeResult.caution}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

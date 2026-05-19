"use client";
import { useState, useEffect } from "react";

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
interface RouteHistory {
  id: string;
  from: string;
  to: string;
  toLocation: string;
  priority: string;
  searchedAt: string;
  data: RouteResponse;
}

const STORAGE_KEY = "will_search_history";
const ROUTE_STORAGE_KEY = "will_route_history";

const STEP_ICON: Record<string, string> = {
  walk: "🚶", train: "🚃", bus: "🚌", subway: "🚇", taxi: "🚕",
};
const STEP_COLOR: Record<string, string> = {
  walk: "#6b7280", train: "#1a4a8a", bus: "#d97706",
  subway: "#7c3aed", taxi: "#dc2626",
};
const STEP_BG: Record<string, string> = {
  walk: "#f3f4f6", train: "#eff6ff", bus: "#fffbeb",
  subway: "#faf5ff", taxi: "#fff5f5",
};
const STEP_LABEL: Record<string, string> = {
  walk: "🚶 徒歩", train: "🚃 電車", bus: "🚌 バス",
  subway: "🚇 地下鉄", taxi: "🚕 タクシー",
};

// ────────────────────────────────────────────
// RouteCard — InfoSearch の外側で定義
// ────────────────────────────────────────────
function RouteCard({ route, index }: { route: Route; index: number }) {
  const [open, setOpen] = useState(index === 0);

  const RANK_COLORS = ["#1a4a8a", "#2d6047", "#7c3aed"];
  const RANK_LABELS = ["🥇 おすすめ", "🥈 別ルート", "🥉 別ルート"];
  const color = RANK_COLORS[index] ?? "#555";

  return (
    <div style={{
      border: `2px solid ${color}`,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 16,
    }}>
      {/* ヘッダー（タップで開閉） */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          background: color,
          color: "#fff",
          padding: "14px 16px",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {RANK_LABELS[index] ?? `ルート${index + 1}`}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 2 }}>
            {route.summary}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <span style={{
            background: "rgba(255,255,255,0.2)",
            borderRadius: 20, padding: "4px 10px", fontSize: 14,
          }}>⏱ {route.total_time}</span>
          <span style={{
            background: "rgba(255,255,255,0.2)",
            borderRadius: 20, padding: "4px 10px", fontSize: 14,
          }}>💴 {route.total_cost}</span>
          <span style={{ fontSize: 18 }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div style={{ background: "#fff", padding: "16px" }}>

          {/* 横タイムライン */}
          <div style={{
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 16,
            gap: 0,
          }}>
            {route.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center", minWidth: 64 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: STEP_COLOR[step.type] ?? "#999",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 22,
                    margin: "0 auto 4px",
                    color: "#fff",
                  }}>
                    {STEP_ICON[step.type] ?? "●"}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: STEP_COLOR[step.type] ?? "#555",
                  }}>
                    {step.duration}
                  </div>
                  {step.cost && (
                    <div style={{ fontSize: 11, color: "#888" }}>
                      {step.cost}
                    </div>
                  )}
                </div>
                {i < route.steps.length - 1 && (
                  <div style={{
                    width: 28, height: 3,
                    background: "#d1d5db",
                    flexShrink: 0,
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* ステップ詳細 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {route.steps.map((step, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                background: STEP_BG[step.type] ?? "#f9fafb",
                borderRadius: 10,
                padding: "12px 14px",
                borderLeft: `4px solid ${STEP_COLOR[step.type] ?? "#ccc"}`,
              }}>
                <div style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>
                  {STEP_ICON[step.type] ?? "●"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 4,
                  }}>
                    <span style={{
                      fontWeight: 700, fontSize: 16,
                      color: STEP_COLOR[step.type] ?? "#333",
                    }}>
                      {STEP_LABEL[step.type] ?? step.type}　{step.duration}
                    </span>
                    {step.cost && (
                      <span style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: "2px 10px",
                        fontSize: 14,
                        color: "#374151",
                      }}>
                        💴 {step.cost}
                      </span>
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
              marginTop: 14,
              padding: "12px 16px",
              background: "#f0fdf4",
              borderRadius: 10,
              border: "1px solid #bbf7d0",
            }}>
              <div style={{
                fontWeight: 700, color: "#15803d",
                fontSize: 15, marginBottom: 6,
              }}>🪑 途中の休憩スポット</div>
              {route.rest_spots.map((spot, i) => (
                <div key={i} style={{
                  fontSize: 15, color: "#166534", paddingBottom: 2,
                }}>・{spot}</div>
              ))}
            </div>
          )}

          {/* 高齢者向けコツ */}
          {route.elder_tips && (
            <div style={{
              marginTop: 10,
              padding: "12px 16px",
              background: "#fffbeb",
              borderRadius: 10,
              border: "1px solid #fde68a",
            }}>
              <div style={{
                fontWeight: 700, color: "#92400e",
                fontSize: 15, marginBottom: 4,
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
}

// ────────────────────────────────────────────
// RouteHistoryCard — InfoSearch の外側で定義
// ────────────────────────────────────────────
const PRIORITY_LABEL: Record<string, string> = {
  comfort:  "🌿 疲れにくい",
  distance: "🚶 歩く距離少なめ",
  cost:     "💴 交通費を節約",
  time:     "⏱ 時間を短く",
};

function RouteHistoryCard({ entry }: { entry: RouteHistory }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      marginBottom: 14,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      {/* ヘッダー（タップで開閉） */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          background: "#f8fafc", padding: "12px 16px",
          border: "none", borderBottom: open ? "1px solid #e5e7eb" : "none",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#374151" }}>
            🚉 {entry.from}　→　📍 {entry.to}
          </div>
          <div style={{
            fontSize: 13, color: "#6b7280", marginTop: 3,
            display: "flex", gap: 10, flexWrap: "wrap",
          }}>
            <span>{PRIORITY_LABEL[entry.priority] ?? entry.priority}</span>
            <span>•</span>
            <span>{entry.data.routes?.length ?? 0}ルート</span>
            <span>•</span>
            <span>{entry.searchedAt}</span>
          </div>
        </div>
        <span style={{ fontSize: 18, marginLeft: 8 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* ルートカード一覧 */}
      {open && (
        <div style={{ padding: "12px 12px 4px" }}>
          {entry.data.routes?.map((route, i) => (
            <RouteCard key={i} route={route} index={i} />
          ))}
          {entry.data.caution && (
            <div style={{
              padding: "10px 14px", background: "#fef9c3",
              borderRadius: 10, fontSize: 14, color: "#713f12",
              border: "1px solid #fde047", marginBottom: 12,
            }}>⚠️ {entry.data.caution}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// TagInput — InfoSearch の外側で定義
// ────────────────────────────────────────────
function TagInput({
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
}) {
  return (
    <div
      style={{
        display: "flex", flexWrap: "wrap", gap: 6,
        alignItems: "center",
        border: "1px solid #d1d5db", borderRadius: 12,
        padding: "8px 12px", background: "#fff", minHeight: 52,
        cursor: "text",
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
              justifyContent: "center", padding: 0, lineHeight: 1,
            }}
          >✕</button>
        </span>
      ))}
      <input
        id={inputId}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && input.trim()) {
            e.preventDefault();
            onAddTag(input.trim());
            onInputChange("");
          }
          if (e.key === "Backspace" && !input && tags.length > 0) {
            onRemoveTag(tags.length - 1);
          }
        }}
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
}

// ────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────
const PRIORITIES = [
  { key: "comfort"  as const, label: "🌿 疲れにくい",    sub: "休憩スポット多め" },
  { key: "distance" as const, label: "🚶 歩く距離少なめ", sub: "乗り換えも少なく" },
  { key: "cost"     as const, label: "💴 交通費を節約",   sub: "最安ルート" },
  { key: "time"     as const, label: "⏱ 時間を短く",     sub: "特急・快速優先" },
];

const CATEGORIES = [
  "絵画・水彩画","書道・習字","陶芸・クラフト","体操・ヨガ",
  "ウォーキング","音楽・コーラス","茶道・華道","料理教室",
  "パソコン","図書館・読書会","ボランティア","温泉・銭湯",
  "公園・植物園","その他",
];

export default function InfoSearch({
  defaultLocation = "",
  conversationMessages = [],
}: {
  defaultLocation?: string;
  conversationMessages?: { role: string; content: string }[];
}) {
  const [locationTags, setLocationTags] = useState<string[]>(
    defaultLocation ? [defaultLocation] : []
  );
  const [locationInput, setLocationInput] = useState("");
  const [queryTags, setQueryTags]     = useState<string[]>([]);
  const [queryInput, setQueryInput]   = useState("");
  const [category, setCategory]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [keywords, setKeywords]       = useState<Keyword[]>([]);
  const [kwLoading, setKwLoading]     = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [routeFrom, setRouteFrom]     = useState("");
  const [routePriority, setRoutePriority] =
    useState<"distance" | "cost" | "time" | "comfort">("comfort");
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeHistory, setRouteHistory] = useState<RouteHistory[]>([]);

  // localStorage から履歴を読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setSearchHistory(JSON.parse(saved)); } catch {}
    }
    const savedRoutes = localStorage.getItem(ROUTE_STORAGE_KEY);
    if (savedRoutes) {
      try { setRouteHistory(JSON.parse(savedRoutes)); } catch {}
    }
  }, []);

  // 会話が更新されたら自動抽出
  useEffect(() => {
    if (conversationMessages.length > 2) extractKeywords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationMessages.length]);

  const saveHistory = (h: SearchHistory[]) => {
    setSearchHistory(h);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
  };

  const saveRouteHistory = (h: RouteHistory[]) => {
    setRouteHistory(h);
    localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(h));
  };

  const extractKeywords = async () => {
    if (!conversationMessages.length) return;
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
      const entry: SearchHistory = {
        id: Date.now().toString(),
        query: qStr,
        location: lStr,
        searchedAt: new Date().toLocaleString("ja-JP", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        }),
        data,
      };
      saveHistory([entry, ...searchHistory]);
    } catch {}
    finally { setLoading(false); }
  };

  const handleRouteSearch = async () => {
    if (!selectedResult || !routeFrom) return;
    setRouteLoading(true);
    setRouteResult(null);
    try {
      const res = await fetch("/api/route-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: routeFrom,
          to: `${selectedResult.name} ${selectedResult.location}`,
          priority: routePriority,
        }),
      });
      const data: RouteResponse = await res.json();
      console.log("Route response:", JSON.stringify(data, null, 2));
      setRouteResult(data);

      // ── ルート履歴に保存 ──
      if (data.routes && data.routes.length > 0) {
        const entry: RouteHistory = {
          id: Date.now().toString(),
          from: routeFrom,
          to: selectedResult.name,
          toLocation: selectedResult.location ?? "",
          priority: routePriority,
          searchedAt: new Date().toLocaleString("ja-JP", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit",
          }),
          data,
        };
        saveRouteHistory([entry, ...routeHistory]);
      }
    } catch (err) {
      console.error("Route error:", err);
    }
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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 60px", fontSize: 16 }}>

      {/* ── キーワードタグ ── */}
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
          >{kwLoading ? "抽出中..." : "🔄 再抽出"}</button>
        </div>
        {keywords.length === 0 ? (
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            面談の会話が増えると自動でキーワードが表示されます
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {keywords.map((kw, i) => (
              <button key={i}
                onClick={() => {
                  if (kw.type === "location") {
                    setLocationTags(p => p.includes(kw.text) ? p : [...p, kw.text]);
                  } else {
                    setQueryTags(p => p.includes(kw.text) ? p : [...p, kw.text]);
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

      {/* ── 検索フォーム ── */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: "16px",
        border: "1px solid #e5e7eb", marginBottom: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{
            fontSize: 15, fontWeight: 700, color: "#374151",
            display: "block", marginBottom: 6,
          }}>
            📍 エリア
            <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af", marginLeft: 8 }}>
              Enterで追加・複数可
            </span>
          </label>
          <TagInput
            tags={locationTags} input={locationInput}
            onInputChange={setLocationInput}
            onAddTag={(v) => setLocationTags(p => p.includes(v) ? p : [...p, v])}
            onRemoveTag={(i) => setLocationTags(p => p.filter((_, j) => j !== i))}
            placeholder="例：豊橋市（Enterで確定）"
            color="#1a4a8a" inputId="location-input"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{
            fontSize: 15, fontWeight: 700, color: "#374151",
            display: "block", marginBottom: 6,
          }}>
            🎯 やりたいこと・キーワード
            <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af", marginLeft: 8 }}>
              Enterで追加・複数可
            </span>
          </label>
          <TagInput
            tags={queryTags} input={queryInput}
            onInputChange={setQueryInput}
            onAddTag={(v) => setQueryTags(p => p.includes(v) ? p : [...p, v])}
            onRemoveTag={(i) => setQueryTags(p => p.filter((_, j) => j !== i))}
            placeholder="例：水彩画 屋外講座（Enterで確定）"
            color="#2d6047" inputId="query-input"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{
            fontSize: 15, fontWeight: 700, color: "#374151",
            display: "block", marginBottom: 6,
          }}>カテゴリ（任意）</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORIES.map((c) => (
              <button key={c}
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
        >{loading ? "🔍 検索中..." : "🔍 地域情報を検索する"}</button>
      </div>

      {/* ── 検索履歴 ── */}
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
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#374151" }}>
                  🔍 {entry.location} × {entry.query}
                </span>
                <span style={{ fontSize: 13, color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>
                  {entry.searchedAt}
                </span>
              </div>

              {entry.data.results?.map((r, i) => (
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
            </div>
          ))}
        </div>
      )}

      {/* ── ルート履歴 ── */}
      {routeHistory.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 12,
          }}>
            <h3 style={{
              fontSize: 18, fontWeight: 700, color: "#1f2937", margin: 0,
            }}>
              🗺 行き方の履歴（{routeHistory.length}件）
            </h3>
            <button
              onClick={() => {
                localStorage.removeItem(ROUTE_STORAGE_KEY);
                setRouteHistory([]);
              }}
              style={{
                fontSize: 14, color: "#ef4444", background: "none",
                border: "1px solid #fca5a5", borderRadius: 8,
                padding: "4px 12px", cursor: "pointer",
              }}
            >🗑 履歴をクリア</button>
          </div>

          {routeHistory.map((entry) => (
            <RouteHistoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* ── ルート提案 ── */}
      <div id="route-section" style={{
        background: "#fff", borderRadius: 14, padding: "16px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <h3 style={{
          fontSize: 18, fontWeight: 700, color: "#1f2937",
          marginTop: 0, marginBottom: 14,
        }}>🗺 行き方を調べる</h3>

        {/* 目的地 */}
        {selectedResult ? (
          <div style={{
            background: "#eff6ff", borderRadius: 10,
            padding: "10px 14px", marginBottom: 14,
            fontSize: 15, color: "#1e3a8a", fontWeight: 600,
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
            background: "#f9fafb", borderRadius: 10,
            padding: "10px 14px", marginBottom: 14,
            fontSize: 14, color: "#9ca3af",
          }}>
            ↑ 検索履歴の「🗺 行き方」ボタンで目的地を設定してください
          </div>
        )}

        {/* 出発地 */}
        <div style={{ marginBottom: 14 }}>
          <label style={{
            fontSize: 15, fontWeight: 700, color: "#374151",
            display: "block", marginBottom: 6,
          }}>🚉 出発地（自宅最寄り駅など）</label>
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

        {/* 優先条件 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            fontSize: 15, fontWeight: 700, color: "#374151",
            display: "block", marginBottom: 8,
          }}>優先条件</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PRIORITIES.map((pr) => (
              <button key={pr.key}
                onClick={() => setRoutePriority(pr.key)}
                style={{
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  border: `2px solid ${routePriority === pr.key ? "#1a4a8a" : "#e5e7eb"}`,
                  background: routePriority === pr.key ? "#eff6ff" : "#fff",
                  textAlign: "left",
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

        {/* 検索ボタン */}
        <button
          onClick={handleRouteSearch}
          disabled={routeLoading || !selectedResult || !routeFrom}
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: "#2d6047", color: "#fff", border: "none",
            fontSize: 18, fontWeight: 700, cursor: "pointer",
            opacity: routeLoading || !selectedResult || !routeFrom ? 0.5 : 1,
            marginBottom: 20,
          }}
        >{routeLoading ? "🗺 検索中..." : "🗺 行き方を調べる"}</button>

        {/* ルートカード */}
        {routeResult && routeResult.routes && routeResult.routes.length > 0 && (
          <div>
            {routeResult.routes.map((route, i) => (
              <RouteCard key={i} route={route} index={i} />
            ))}
            {routeResult.caution && (
              <div style={{
                padding: "10px 14px", background: "#fef9c3",
                borderRadius: 10, fontSize: 14, color: "#713f12",
                border: "1px solid #fde047", marginTop: 8,
              }}>⚠️ {routeResult.caution}</div>
            )}
          </div>
        )}

        {routeResult && (!routeResult.routes || routeResult.routes.length === 0) && (
          <div style={{
            padding: "16px", background: "#fff5f5", borderRadius: 10,
            fontSize: 15, color: "#991b1b", textAlign: "center",
          }}>
            ルート情報を取得できませんでした。出発地・目的地を確認して再度お試しください。
          </div>
        )}
      </div>
    </div>
  );
}

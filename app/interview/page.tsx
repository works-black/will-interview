'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInterview } from '@/context/InterviewContext';
import PhaseProgress from '@/components/PhaseProgress';
import ChatInterface from '@/components/ChatInterface';
import InfoSearch from '@/components/InfoSearch';
import { phaseNames } from '@/lib/interview-prompts';
import type { Phase, QuestionResponse } from '@/lib/types';

const SEARCH_TRIGGER_KEYWORDS = [
  '行ってみたい', 'やってみたい', 'どこかないか', 'どこかある',
  '教室', '講座', '場所', 'サークル', '習い事',
];

function buildSummary(messages: ReturnType<typeof useInterview>['state']['messages']): string {
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) return '（まだ回答なし）';
  return userMessages.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
}

function detectSearchHint(text: string): boolean {
  return SEARCH_TRIGGER_KEYWORDS.some((kw) => text.includes(kw));
}

type Tab = 'interview' | 'search';

export default function InterviewPage() {
  const router = useRouter();
  const { state, addMessage, advancePhase, completeInterview } = useInterview();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('interview');
  const [showSearchHint, setShowSearchHint] = useState(false);

  const fetchNextQuestion = useCallback(async (userContent?: string) => {
    setIsLoading(true);
    try {
      const summary = buildSummary(state.messages);

      const apiMessages = state.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      if (userContent) {
        apiMessages.push({ role: 'user', content: userContent });
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          phase: state.currentPhase,
          summary,
        }),
      });

      if (!response.ok) throw new Error('Chat API error');
      const result: QuestionResponse = await response.json();

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.question,
        timestamp: new Date(),
        phase: state.currentPhase,
        meta: { intent: result.intent, followup_triggers: result.followup_triggers },
      });

      // Show search hint if AI question mentions relevant keywords
      if (detectSearchHint(result.question)) {
        setShowSearchHint(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [state.messages, state.currentPhase, addMessage]);

  const handleSendMessage = useCallback(async (content: string) => {
    addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      phase: state.currentPhase,
    });
    // Also trigger search hint if the user's own words contain keywords
    if (detectSearchHint(content)) setShowSearchHint(true);
    await fetchNextQuestion(content);
  }, [state.currentPhase, addMessage, fetchNextQuestion]);

  const handleStartOrAdvance = async () => {
    if (state.currentPhase < 5) {
      advancePhase();
      setShowSearchHint(false);
      setIsLoading(true);
      try {
        const summary = buildSummary(state.messages);
        const apiMessages = state.messages.map((m) => ({ role: m.role, content: m.content }));
        const nextPhase = (state.currentPhase + 1) as Phase;
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, phase: nextPhase, summary }),
        });
        if (!response.ok) throw new Error('Chat API error');
        const result: QuestionResponse = await response.json();
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.question,
          timestamp: new Date(),
          phase: nextPhase,
          meta: { intent: result.intent, followup_triggers: result.followup_triggers },
        });
        if (detectSearchHint(result.question)) setShowSearchHint(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFinishInterview = () => {
    completeInterview();
    router.push('/plan');
  };

  const isLastPhase = state.currentPhase === 5;
  const hasMessagesThisPhase = state.messages.some((m) => m.phase === state.currentPhase);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 no-print">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-800">WILL面談ツール</h1>
          <p className="text-sm text-gray-500">
            フェーズ {state.currentPhase}：{phaseNames[state.currentPhase as Phase]}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 py-3 no-print">
        <PhaseProgress currentPhase={state.currentPhase as Phase} />
      </div>

      {/* Tab bar */}
      <div className="max-w-4xl mx-auto w-full px-4 mb-2 no-print">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('interview')}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              activeTab === 'interview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            💬 面談
          </button>
          <button
            onClick={() => { setActiveTab('search'); setShowSearchHint(false); }}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors relative ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            🔍 地域情報検索
            {showSearchHint && activeTab !== 'search' && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Search hint banner */}
        {showSearchHint && activeTab === 'interview' && (
          <button
            onClick={() => { setActiveTab('search'); setShowSearchHint(false); }}
            className="mt-2 w-full flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100 transition-colors text-left"
          >
            <span className="text-lg">💡</span>
            <span>地域の活動・施設情報を検索しますか？ <strong>→ 地域情報検索を開く</strong></span>
          </button>
        )}
      </div>

      {/* Tab content */}
      <div
        className="flex-1 max-w-4xl mx-auto w-full px-4 flex flex-col min-h-0"
        style={{ height: 'calc(100vh - 240px)' }}
      >
        {activeTab === 'interview' ? (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <ChatInterface
              messages={state.messages}
              currentPhase={state.currentPhase as Phase}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-4">
            <InfoSearch
              conversationMessages={state.messages.map((m) => ({
                role: m.role,
                content: m.content,
              }))}
            />
          </div>
        )}
      </div>

      {/* Bottom action buttons — only show on interview tab */}
      {activeTab === 'interview' && (
        <div className="max-w-4xl mx-auto w-full px-4 py-4 flex gap-3 no-print">
          {state.messages.length === 0 ? (
            <button
              onClick={() => fetchNextQuestion()}
              disabled={isLoading}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? '質問を生成中...' : '会話を始める（最初の質問を生成）'}
            </button>
          ) : !isLastPhase ? (
            <button
              onClick={handleStartOrAdvance}
              disabled={isLoading || !hasMessagesThisPhase}
              className="flex-1 py-4 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '質問を生成中...' : `次のフェーズへ → ${phaseNames[(state.currentPhase + 1) as Phase]}`}
            </button>
          ) : (
            <button
              onClick={handleFinishInterview}
              disabled={isLoading || !hasMessagesThisPhase}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              面談を完了してプランを作成する
            </button>
          )}
        </div>
      )}
    </div>
  );
}

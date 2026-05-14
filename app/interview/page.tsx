'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInterview } from '@/context/InterviewContext';
import PhaseProgress from '@/components/PhaseProgress';
import ChatInterface from '@/components/ChatInterface';
import { phaseNames } from '@/lib/interview-prompts';
import type { Phase, QuestionResponse } from '@/lib/types';

function buildSummary(messages: ReturnType<typeof useInterview>['state']['messages']): string {
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) return '（まだ回答なし）';
  return userMessages.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
}

export default function InterviewPage() {
  const router = useRouter();
  const { state, addMessage, advancePhase, completeInterview } = useInterview();
  const [isLoading, setIsLoading] = useState(false);

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
    await fetchNextQuestion(content);
  }, [state.currentPhase, addMessage, fetchNextQuestion]);

  const handleAdvancePhase = async () => {
    if (state.currentPhase < 5) {
      advancePhase();
    }
  };

  // When phase changes, fetch the first question for the new phase
  useEffect(() => {
    if (state.messages.length === 0 || state.messages[state.messages.length - 1].role === 'user') {
      return;
    }
    // Fetch opening question after phase advance (last message is from assistant — skip)
  }, [state.currentPhase]);

  const handleStartOrAdvance = async () => {
    if (state.currentPhase < 5) {
      advancePhase();
      // Fetch opening question for new phase
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

      <div
        className="flex-1 max-w-4xl mx-auto w-full px-4 flex flex-col min-h-0"
        style={{ height: 'calc(100vh - 220px)' }}
      >
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <ChatInterface
            messages={state.messages}
            currentPhase={state.currentPhase as Phase}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>

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
    </div>
  );
}

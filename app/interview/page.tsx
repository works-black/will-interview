'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInterview } from '@/context/InterviewContext';
import PhaseProgress from '@/components/PhaseProgress';
import ChatInterface from '@/components/ChatInterface';
import { phaseNames } from '@/lib/interview-prompts';
import type { Phase } from '@/lib/types';

export default function InterviewPage() {
  const router = useRouter();
  const { state, addMessage, advancePhase, completeInterview } = useInterview();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
      phase: state.currentPhase,
    };
    addMessage(userMsg);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const apiMessages = [...state.messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, phase: state.currentPhase }),
      });

      if (!response.ok || !response.body) throw new Error('Chat API error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamingContent(accumulated);
      }

      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: accumulated,
        timestamp: new Date(),
        phase: state.currentPhase,
      });
      setStreamingContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  }, [state.messages, state.currentPhase, addMessage]);

  const handleAdvancePhase = () => {
    if (state.currentPhase < 5) {
      advancePhase();
    }
  };

  const handleFinishInterview = async () => {
    setIsGenerating(true);
    try {
      completeInterview();
      router.push('/plan');
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  const isLastPhase = state.currentPhase === 5;

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

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 flex flex-col min-h-0" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <ChatInterface
            messages={state.messages}
            currentPhase={state.currentPhase as Phase}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 py-4 flex gap-3 no-print">
        {!isLastPhase ? (
          <button
            onClick={handleAdvancePhase}
            disabled={isStreaming || state.messages.filter((m) => m.phase === state.currentPhase).length === 0}
            className="flex-1 py-4 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次のフェーズへ → {phaseNames[(state.currentPhase + 1) as Phase]}
          </button>
        ) : (
          <button
            onClick={handleFinishInterview}
            disabled={isStreaming || isGenerating || state.messages.filter((m) => m.phase === 5).length === 0}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'プラン生成中...' : '面談を完了してプランを作成する'}
          </button>
        )}
      </div>
    </div>
  );
}

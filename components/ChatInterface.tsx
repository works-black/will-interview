'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message, Phase } from '@/lib/types';

interface Props {
  messages: Message[];
  currentPhase: Phase;
  onSendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
}

export default function ChatInterface({
  messages,
  currentPhase,
  onSendMessage,
  isStreaming,
  streamingContent,
}: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const content = input.trim();
    setInput('');
    await onSendMessage(content);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-lg">面談を開始してください</p>
            <p className="text-sm mt-2">高齢者の言葉を下の入力欄に入力してください</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <p className="text-xs text-gray-500 mb-1 font-medium">AIサポート</p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-5 py-3 bg-gray-100 text-gray-800">
              <p className="text-xs text-gray-500 mb-1 font-medium">AIサポート</p>
              <p className="whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
            </div>
          </div>
        )}
        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-5 py-3 bg-gray-100">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="高齢者の言葉を入力してください（Enterで送信）"
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[56px] max-h-32"
            rows={2}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
}

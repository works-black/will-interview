'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, Phase } from '@/lib/types';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface Props {
  messages: Message[];
  currentPhase: Phase;
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

export default function ChatInterface({
  messages,
  currentPhase,
  onSendMessage,
  isLoading,
}: Props) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  // Accumulate confirmed (final) results separately to avoid re-processing
  const confirmedTranscriptRef = useRef('');

  useEffect(() => {
    setIsSpeechSupported(
      typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    confirmedTranscriptRef.current = input; // Start from existing input content

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let newFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (newFinalTranscript) {
        confirmedTranscriptRef.current += newFinalTranscript;
      }
      setInput(confirmedTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('マイクの使用許可が必要です。ブラウザの設定でマイクを許可してください。');
        }
      }
      stopRecognition();
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  }, [input, stopRecognition]);

  const handleMicPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    startRecognition();
  };

  const handleMicPointerUp = () => {
    stopRecognition();
  };

  // Stop recognition if pointer leaves the button while held
  const handleMicPointerLeave = () => {
    if (isListening) stopRecognition();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const content = input.trim();
    setInput('');
    confirmedTranscriptRef.current = '';
    await onSendMessage(content);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-lg">面談を開始してください</p>
            <p className="text-sm mt-2">最初の質問を生成するには「会話を始める」ボタンを押してください</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-5 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <p className="text-xs text-blue-500 mb-1.5 font-semibold">AIコーディネーター — 次の質問</p>
              )}
              {msg.role === 'user' && (
                <p className="text-xs text-blue-100 mb-1 font-medium">利用者の言葉</p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>

            {msg.role === 'assistant' && msg.meta && (
              <div className="mt-2 max-w-[82%] space-y-1.5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  <p className="text-xs font-semibold text-amber-600 mb-0.5">意図</p>
                  <p className="text-sm text-amber-900">{msg.meta.intent}</p>
                </div>
                {msg.meta.followup_triggers.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                    <p className="text-xs font-semibold text-green-600 mb-1.5">深掘りキーワード</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.meta.followup_triggers.map((kw, i) => (
                        <span key={i} className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-5 py-3 bg-white border border-gray-200 shadow-sm">
              <p className="text-xs text-blue-500 mb-1.5 font-semibold">AIコーディネーター</p>
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

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400">利用者が話した内容を入力してください</p>
          {isListening && (
            <span className="text-xs text-red-500 font-semibold animate-pulse">
              🔴 認識中...
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="利用者の言葉を入力（Enterで送信）"
            className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[56px] max-h-32"
            rows={2}
            disabled={isLoading}
          />

          {isSpeechSupported && (
            <button
              type="button"
              onPointerDown={handleMicPointerDown}
              onPointerUp={handleMicPointerUp}
              onPointerLeave={handleMicPointerLeave}
              disabled={isLoading}
              aria-label={isListening ? '録音中（離すと停止）' : 'マイク入力（押している間だけ録音）'}
              className={`w-14 rounded-xl flex flex-col items-center justify-center gap-0.5 select-none transition-all touch-none ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-xl leading-none">{isListening ? '🔴' : '🎤'}</span>
              <span className="text-[10px] font-medium leading-none">
                {isListening ? '録音中' : 'マイク'}
              </span>
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
}

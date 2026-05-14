'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInterview } from '@/context/InterviewContext';
import PlanCard from '@/components/PlanCard';
import type { Plan } from '@/lib/types';

export default function PlanPage() {
  const router = useRouter();
  const { state, setPlan } = useInterview();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state.isComplete) {
      router.replace('/interview');
      return;
    }
    if (!state.plan) {
      generatePlan();
    }
  }, []);

  const generatePlan = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: state.messages }),
      });
      if (!response.ok) throw new Error('Plan generation failed');
      const plan: Plan = await response.json();
      setPlan(plan);
    } catch (err) {
      setError('プランの生成に失敗しました。再試行してください。');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-600">外出支援プランを生成中...</p>
          <p className="text-gray-400 mt-2">面談内容を分析しています</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={generatePlan}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  const plan = state.plan;
  if (!plan) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">外出支援プラン</h1>
            <p className="text-sm text-gray-500">3ヶ月間の外出支援計画</p>
          </div>
          <Link
            href="/report"
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            レポートを見る →
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">面談サマリー</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">3ヶ月後のゴール</h3>
              <p className="text-gray-800 bg-blue-50 rounded-xl px-4 py-3 font-medium">{plan.summary.goal}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-2">阻害要因</h3>
                <ul className="space-y-1">
                  {plan.summary.barriers.map((b, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">●</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-500 uppercase tracking-wide mb-2">強み・資源</h3>
                <ul className="space-y-1">
                  {plan.summary.strengths.map((s, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">●</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">3ヶ月プラン</h2>
          <div className="grid grid-cols-1 gap-4">
            {plan.months.map((month) => (
              <PlanCard key={month.month} plan={month} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">最初の3ステップ</h2>
          <ol className="space-y-3">
            {plan.firstSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </span>
                <p className="text-gray-800 leading-relaxed mt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {plan.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
            <h2 className="text-base font-bold text-yellow-800 mb-2">備考・特記事項</h2>
            <p className="text-yellow-900 leading-relaxed">{plan.notes}</p>
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <Link
            href="/interview"
            className="flex-1 py-4 text-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors"
          >
            面談に戻る
          </Link>
          <Link
            href="/report"
            className="flex-1 py-4 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
          >
            レポートを作成する →
          </Link>
        </div>
      </div>
    </div>
  );
}

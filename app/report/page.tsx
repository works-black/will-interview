'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useInterview } from '@/context/InterviewContext';
import PlanCard from '@/components/PlanCard';
import type { QolScores } from '@/lib/types';

const QolRadarChart = dynamic(() => import('@/components/QolRadarChart'), { ssr: false });

export default function ReportPage() {
  const router = useRouter();
  const { state, setQolScores } = useInterview();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state.isComplete) {
      router.replace('/interview');
      return;
    }
    if (!state.qolScores) {
      scoreQol();
    }
  }, []);

  const scoreQol = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/score-qol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: state.messages }),
      });
      if (!response.ok) throw new Error('QOL scoring failed');
      const scores: QolScores = await response.json();
      setQolScores(scores);
    } catch (err) {
      setError('QOLスコアの算出に失敗しました。再試行してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-600">QOLスコアを算出中...</p>
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
            onClick={scoreQol}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  const { qolScores, plan } = state;
  if (!qolScores || !plan) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 no-print">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">面談レポート</h1>
            <p className="text-sm text-gray-500">{today}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/plan"
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← プランに戻る
            </Link>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              PDFで保存
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-800">Will B 面談レポート</h1>
            <span className="text-sm text-gray-400">{today}</span>
          </div>
          <p className="text-gray-500 text-sm">外出支援プログラム 面談記録</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">QOLスコア（6軸評価）</h2>
          <QolRadarChart scores={qolScores} />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Object.entries(qolScores).map(([key, value]) => (
              <div key={key} className="text-center bg-gray-50 rounded-xl py-3 px-2">
                <p className="text-xs text-gray-500 mb-1">{key}</p>
                <p className="text-2xl font-bold text-blue-600">{value}</p>
                <p className="text-xs text-gray-400">/ 100</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">面談サマリー</h2>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">3ヶ月後のゴール</h3>
            <p className="bg-blue-50 rounded-xl px-4 py-3 text-gray-800 font-medium">{plan.summary.goal}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-red-500 mb-2">阻害要因</h3>
              <ul className="space-y-1">
                {plan.summary.barriers.map((b, i) => (
                  <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                    <span className="text-red-400 shrink-0">●</span>{b}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-500 mb-2">強み・資源</h3>
              <ul className="space-y-1">
                {plan.summary.strengths.map((s, i) => (
                  <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                    <span className="text-green-400 shrink-0">●</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="print-break">
          <h2 className="text-lg font-bold text-gray-800 mb-3">3ヶ月外出プラン</h2>
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

        <div className="pb-8 no-print">
          <button
            onClick={handlePrint}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-lg"
          >
            PDFとして保存する
          </button>
        </div>
      </div>
    </div>
  );
}

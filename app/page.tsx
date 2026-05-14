import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">WILL面談ツール</h1>
          <p className="text-gray-500 text-lg">Will B プログラム 外出支援面談サポートシステム</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">面談の流れ</h2>
          <div className="space-y-3 text-left">
            {[
              { num: 1, name: 'アイスブレイク', desc: '信頼関係を築く' },
              { num: 2, name: '外出意欲の確認', desc: '行きたい場所・やりたいことを探る' },
              { num: 3, name: '阻害要因の深掘り', desc: '外出を妨げる要因を把握する' },
              { num: 4, name: '強みの確認', desc: '本人の資源・能力を発見する' },
              { num: 5, name: 'ゴール設定', desc: '3ヶ月で達成できるゴールを決める' },
            ].map((phase) => (
              <div key={phase.num} className="flex items-center gap-4 py-2">
                <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {phase.num}
                </span>
                <div>
                  <span className="font-semibold text-gray-800">{phase.name}</span>
                  <span className="text-gray-500 ml-2 text-sm">— {phase.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/interview"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-10 py-4 rounded-2xl transition-colors shadow-md"
        >
          面談を開始する
        </Link>
      </div>
    </main>
  );
}

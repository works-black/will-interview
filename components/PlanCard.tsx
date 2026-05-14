import type { MonthPlan } from '@/lib/types';

interface Props {
  plan: MonthPlan;
}

const monthColors = [
  'bg-blue-50 border-blue-200',
  'bg-green-50 border-green-200',
  'bg-purple-50 border-purple-200',
];

const monthBadgeColors = [
  'bg-blue-600',
  'bg-green-600',
  'bg-purple-600',
];

export default function PlanCard({ plan }: Props) {
  const colorIndex = (plan.month - 1) % 3;
  return (
    <div className={`rounded-2xl border-2 p-5 ${monthColors[colorIndex]}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-white text-sm font-bold px-3 py-1 rounded-full ${monthBadgeColors[colorIndex]}`}>
          {plan.month}ヶ月目
        </span>
      </div>
      <p className="font-bold text-lg text-gray-800">{plan.destination}</p>
      <p className="text-gray-600 mt-1 leading-relaxed">{plan.purpose}</p>
    </div>
  );
}

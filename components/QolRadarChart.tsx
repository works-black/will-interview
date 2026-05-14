'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { QolScores } from '@/lib/types';

interface Props {
  scores: QolScores;
}

export default function QolRadarChart({ scores }: Props) {
  const data = Object.entries(scores).map(([key, value]) => ({
    subject: key,
    score: value,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 14 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Radar
            name="QOLスコア"
            dataKey="score"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.3}
          />
          <Tooltip formatter={(value: number) => [`${value}点`, 'スコア']} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

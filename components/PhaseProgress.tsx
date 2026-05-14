'use client';

import type { Phase } from '@/lib/types';
import { phaseNames } from '@/lib/interview-prompts';

interface Props {
  currentPhase: Phase;
}

export default function PhaseProgress({ currentPhase }: Props) {
  const phases: Phase[] = [1, 2, 3, 4, 5];

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => (
          <div key={phase} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                  phase < currentPhase
                    ? 'bg-green-500 border-green-500 text-white'
                    : phase === currentPhase
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {phase < currentPhase ? '✓' : phase}
              </div>
              <span
                className={`mt-1 text-xs text-center max-w-[72px] leading-tight ${
                  phase === currentPhase ? 'text-blue-600 font-semibold' : 'text-gray-500'
                }`}
              >
                {phaseNames[phase]}
              </span>
            </div>
            {index < phases.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  phase < currentPhase ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

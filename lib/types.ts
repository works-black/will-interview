export type Phase = 1 | 2 | 3 | 4 | 5;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  phase?: Phase;
}

export interface QolScores {
  外出意欲: number;
  移動能力: number;
  社会参加: number;
  精神的健康: number;
  身体的健康: number;
  生活満足度: number;
}

export interface MonthPlan {
  month: number;
  destination: string;
  purpose: string;
}

export interface InterviewSummary {
  barriers: string[];
  strengths: string[];
  goal: string;
  notes: string;
}

export interface Plan {
  summary: InterviewSummary;
  months: MonthPlan[];
  firstSteps: string[];
  notes: string;
}

export interface InterviewState {
  messages: Message[];
  currentPhase: Phase;
  qolScores: QolScores | null;
  plan: Plan | null;
  isComplete: boolean;
}

'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Message, Phase, QolScores, Plan, InterviewState } from '@/lib/types';

type Action =
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'SET_QOL_SCORES'; scores: QolScores }
  | { type: 'SET_PLAN'; plan: Plan }
  | { type: 'COMPLETE_INTERVIEW' }
  | { type: 'RESET' };

const initialState: InterviewState = {
  messages: [],
  currentPhase: 1,
  qolScores: null,
  plan: null,
  isComplete: false,
};

function reducer(state: InterviewState, action: Action): InterviewState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'ADVANCE_PHASE':
      if (state.currentPhase < 5) {
        return { ...state, currentPhase: (state.currentPhase + 1) as Phase };
      }
      return state;
    case 'SET_QOL_SCORES':
      return { ...state, qolScores: action.scores };
    case 'SET_PLAN':
      return { ...state, plan: action.plan };
    case 'COMPLETE_INTERVIEW':
      return { ...state, isComplete: true };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface InterviewContextValue {
  state: InterviewState;
  addMessage: (message: Message) => void;
  advancePhase: () => void;
  setQolScores: (scores: QolScores) => void;
  setPlan: (plan: Plan) => void;
  completeInterview: () => void;
  reset: () => void;
}

const InterviewContext = createContext<InterviewContextValue | null>(null);

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value: InterviewContextValue = {
    state,
    addMessage: (message) => dispatch({ type: 'ADD_MESSAGE', message }),
    advancePhase: () => dispatch({ type: 'ADVANCE_PHASE' }),
    setQolScores: (scores) => dispatch({ type: 'SET_QOL_SCORES', scores }),
    setPlan: (plan) => dispatch({ type: 'SET_PLAN', plan }),
    completeInterview: () => dispatch({ type: 'COMPLETE_INTERVIEW' }),
    reset: () => dispatch({ type: 'RESET' }),
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
  return ctx;
}

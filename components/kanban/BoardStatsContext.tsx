"use client";

import { createContext, useContext, ReactNode, useState } from "react";

interface BoardStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

export interface BoardStatsContextType {
  stats: BoardStats;
  updateStats: (newStats: Partial<BoardStats>) => void;
}

export const BoardStatsContext = createContext<BoardStatsContextType | undefined>(undefined);

export function useBoardStats() {
  const context = useContext(BoardStatsContext);
  if (context === undefined) {
    throw new Error('useBoardStats must be used within a BoardStatsProvider');
  }
  return context;
}

export function BoardStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<BoardStats>({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0
  });

  const updateStats = (newStats: Partial<BoardStats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  return (
    <BoardStatsContext.Provider value={{ stats, updateStats }}>
      {children}
    </BoardStatsContext.Provider>
  );
}

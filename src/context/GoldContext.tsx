'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface GoldContextType {
  displayGold: number;
  setDisplayGold: (gold: number) => void;
}

const GoldContext = createContext<GoldContextType | null>(null);

export function GoldProvider({ initialGold, children }: { initialGold: number; children: ReactNode }) {
  const [displayGold, setDisplayGold] = useState(initialGold);
  return (
    <GoldContext.Provider value={{ displayGold, setDisplayGold }}>
      {children}
    </GoldContext.Provider>
  );
}

export function useGold() {
  const ctx = useContext(GoldContext);
  if (!ctx) throw new Error('useGold must be used inside GoldProvider');
  return ctx;
}

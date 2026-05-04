'use client';

import { useState } from 'react';
import PokerTable from './PokerTable';

const STAKES = [
  { label: 'Low Stakes',   ante: 5,   icon: '🌵', color: 'text-teal-400   border-teal-600   hover:border-teal-400',   desc: 'For greenhorns finding their feet.' },
  { label: 'The Saloon',   ante: 10,  icon: '🍺', color: 'text-sand-400   border-sand-600   hover:border-sand-400',   desc: 'Standard table. Cowboys welcome.' },
  { label: 'High Roller',  ante: 25,  icon: '🤠', color: 'text-amber-400  border-amber-600  hover:border-amber-400',  desc: 'Big bets. Big swagger. Big losses.' },
  { label: 'Desperado',    ante: 100, icon: '💀', color: 'text-red-400    border-red-700    hover:border-red-500',    desc: 'All or nothing. Outlaws only.' },
];

export default function StakeSelector({ initialGold }: { initialGold: number }) {
  const [selectedAnte, setSelectedAnte] = useState<number | null>(null);

  if (selectedAnte !== null) {
    return <PokerTable initialGold={initialGold} defaultBet={selectedAnte} />;
  }

  return (
    <div className="space-y-10 py-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <p className="text-terracotta-400 uppercase tracking-[0.3em] text-lg font-bold">Choose Your Poison</p>
        <h2 className="text-4xl font-heading">Pick Your Stakes</h2>
        <p className="text-sand-500 text-lg">Your gold on the table: <span className="text-sand-200 font-heading text-2xl">{initialGold} 💰</span></p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {STAKES.map(stake => {
          const canAfford = initialGold >= stake.ante;
          return (
            <button
              key={stake.ante}
              onClick={() => canAfford && setSelectedAnte(stake.ante)}
              disabled={!canAfford}
              className={`panel-pixel border-4 p-8 text-left space-y-3 transition-all duration-300 group
                ${canAfford
                  ? `${stake.color} hover:translate-x-1 hover:-translate-y-1 hover:bg-rust-800/80 cursor-pointer`
                  : 'border-rust-800 opacity-30 cursor-not-allowed grayscale'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <span className="text-5xl group-hover:scale-110 transition-transform">{stake.icon}</span>
                <div>
                  <p className="font-heading text-2xl uppercase tracking-wider">{stake.label}</p>
                  <p className="text-terracotta-400 font-bold text-xl">{stake.ante} Gold Ante</p>
                </div>
              </div>
              <p className="text-sand-500 text-lg italic">&quot;{stake.desc}&quot;</p>
              {!canAfford && (
                <p className="text-red-400 text-sm font-bold uppercase tracking-wider">Not enough gold</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Card {
  id: string;
  name: string;
  rarity: string;
  image_url: string | null;
  description: string | null;
}

interface CodexGridProps {
  allCards: Card[];
  ownedIds: Set<string>;
}

const RARITY_ORDER: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 };
const RARITY_COLOR: Record<string, string> = {
  Legendary: 'text-yellow-400 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]',
  Epic:      'text-purple-400 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
  Rare:      'text-blue-400  border-blue-500',
  Uncommon:  'text-green-400 border-green-600',
  Common:    'text-sand-500  border-rust-700',
};

export default function CodexGrid({ allCards, ownedIds }: CodexGridProps) {
  const [filter, setFilter] = useState<string>('All');
  const rarities = ['All', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

  const sorted = [...allCards].sort((a, b) => (RARITY_ORDER[a.rarity] ?? 5) - (RARITY_ORDER[b.rarity] ?? 5));
  const filtered = filter === 'All' ? sorted : sorted.filter(c => c.rarity === filter);
  const ownedCount = allCards.filter(c => ownedIds.has(c.id)).length;

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="panel-pixel bg-rust-950/60 border-sand-500/30 py-6 px-8 space-y-3">
        <div className="flex justify-between items-end">
          <p className="text-sand-500 uppercase tracking-widest text-sm font-bold">Collection Progress</p>
          <p className="font-heading text-2xl text-sand-200">{ownedCount} <span className="text-sand-600">/ {allCards.length}</span></p>
        </div>
        <div className="h-5 w-full bg-rust-950 border-2 border-rust-800 p-0.5 relative">
          <div
            className="h-full bg-gradient-to-r from-terracotta-600 to-amber-500 transition-all duration-1000"
            style={{ width: `${Math.max(2, (ownedCount / allCards.length) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-sand-600 italic text-center">
          {ownedCount === allCards.length
            ? '"You own every artifact in the Frontier. Truly a legend."'
            : `"${allCards.length - ownedCount} artifact${allCards.length - ownedCount !== 1 ? 's' : ''} still out there, partner."`}
        </p>
      </div>

      {/* Rarity Filter */}
      <div className="flex flex-wrap gap-2">
        {rarities.map(r => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`btn-pixel py-2 px-4 text-sm ${filter === r ? 'bg-sand-400 text-rust-900 border-sand-600' : 'bg-rust-900 border-rust-950 text-sand-400'}`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map(card => {
          const owned = ownedIds.has(card.id);
          const colorClass = RARITY_COLOR[card.rarity] || RARITY_COLOR.Common;
          return (
            <div
              key={card.id}
              title={owned ? `${card.name} — ${card.description || ''}` : '??? — Not yet discovered'}
              className={`panel-pixel !p-2 border-2 flex flex-col items-center gap-1 transition-all duration-300 group relative
                ${owned ? colorClass : 'border-rust-800 opacity-40 grayscale'}
                ${owned ? 'hover:scale-105 hover:-translate-y-1 cursor-pointer' : 'cursor-not-allowed'}
              `}
            >
              {/* Card Image */}
              <div className="w-full aspect-square relative bg-rust-950 flex items-center justify-center overflow-hidden">
                {card.image_url ? (
                  <Image
                    src={card.image_url}
                    alt={owned ? card.name : '???'}
                    fill
                    className="pixelated object-contain p-1"
                    unoptimized
                  />
                ) : (
                  <span className="text-4xl">{owned ? '🃏' : '❓'}</span>
                )}
                {/* Lock overlay for unowned */}
                {!owned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-rust-950/60">
                    <span className="text-3xl">🔒</span>
                  </div>
                )}
                {/* Shimmer for Legendary owned */}
                {owned && card.rarity === 'Legendary' && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-card-shimmer" />
                  </div>
                )}
              </div>
              {/* Name + Rarity */}
              <p className={`text-xs text-center font-heading leading-tight w-full break-words px-1 ${owned ? '' : 'text-rust-700'}`}>
                {owned ? card.name : '???'}
              </p>
              <p className={`text-xs uppercase tracking-wider font-bold ${owned ? colorClass.split(' ')[0] : 'text-rust-800'}`}>
                {card.rarity}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';

interface InteractiveCardProps {
  card: {
    name: string;
    rarity: string;
    image_url: string | null;
    special_attribute: string | null;
    description: string | null;
  };
  rarityClass: string;
  rarityTextClass: string;
}

export default function InteractiveCard({ card, rarityClass, rarityTextClass }: InteractiveCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="group perspective-1000 w-full h-[450px] cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`
        relative w-full h-full transition-transform duration-700 preserve-3d
        ${isFlipped ? 'rotate-y-180' : ''}
        group-hover:scale-105 group-hover:-translate-y-2
      `}>
        
        {/* Front of Card */}
        <div className={`
          absolute inset-0 backface-hidden panel-pixel flex flex-col h-full bg-rust-900/60
          ${rarityClass}
        `}>
          <div className="aspect-square bg-rust-900 mb-6 flex items-center justify-center border-4 border-rust-700 relative overflow-hidden shrink-0">
            {card.image_url ? (
              <Image 
                src={card.image_url} 
                alt={card.name} 
                fill
                className="pixelated p-4 object-contain"
                unoptimized
              />
            ) : (
              <span className="text-6xl">🃏</span>
            )}
            <div className={`absolute bottom-0 left-0 right-0 bg-rust-900/90 p-2 text-sm text-center uppercase border-t-2 border-rust-700 tracking-tighter ${rarityTextClass}`}>
              {card.rarity}
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center space-y-4 px-2">
            <h3 className="text-xl text-center font-heading text-sand-200 uppercase tracking-widest">{card.name}</h3>
            <p className={`text-sm text-center uppercase tracking-[0.2em] font-bold ${rarityTextClass}`}>
              {card.special_attribute}
            </p>
            <div className="pt-4 opacity-40 text-[10px] uppercase font-bold tracking-widest animate-pulse">
              Click to Flip
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div className={`
          absolute inset-0 backface-hidden rotate-y-180 panel-pixel flex flex-col items-center justify-center h-full bg-rust-800
          ${rarityClass}
        `}>
          <div className="absolute inset-4 border-2 border-dashed border-sand-500/20 pointer-events-none"></div>
          
          <div className="w-24 h-24 relative mb-6 opacity-40">
             <Image src="/cards/card-back.svg" alt="Card Back" fill className="pixelated" unoptimized />
          </div>

          <div className="px-6 space-y-4 text-center">
            <h4 className="font-heading text-sand-400 text-lg uppercase border-b-2 border-rust-900 pb-2">Artifact Lore</h4>
            <p className="text-base text-sand-300 italic leading-relaxed font-pixel">
              &quot;{card.description || 'A tattered remnant of a forgotten era, found buried beneath the red sands of the frontier.'}&quot;
            </p>
          </div>

          <div className="mt-8 text-[10px] text-sand-600 uppercase tracking-[0.3em] font-bold">
            Property of El Rancho
          </div>
        </div>

      </div>
    </div>
  );
}

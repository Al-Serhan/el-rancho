'use client';

import { useState, useEffect } from 'react';

const BULLETINS = [
  "The desert is vast, but the law is long. Keep your cards close.",
  "Wanted: Dead or Alive - One-Eyed Mossy for cattle rustlin'.",
  "Town meeting tonight at the Saloon. No spurs allowed inside.",
  "Gold prices are up. Watch your purse strings, partner.",
  "A new shipment of exotic cards has arrived at the Trading Post.",
  "The Sheriff is lookin' for a new Deputy. Honor must be at least 50.",
  "Don't drink the water at Rattlesnake Creek. It's... peculiar.",
  "Lost: One brown mule. Answers to 'Barnaby'. Reward: 5 gold coins.",
  "Reminder: High-stakes poker is for Legends only. Or the very brave.",
  "Respect the town laws, or you'll find yourself in the cooler."
];

export default function SheriffBulletin() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Change bulletin every 10 seconds for a "dynamic" feel
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % BULLETINS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel-pixel bg-[#f4e4bc] border-sand-600 text-rust-900 shadow-xl py-8 px-8 relative overflow-hidden group">
      {/* Wanted Poster Texture Overlays */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-rust-900/10 -rotate-45 translate-x-6 -translate-y-6"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 bg-rust-900/10 rotate-12 -translate-x-2 translate-y-2"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4 border-b-2 border-rust-900/20 pb-2">
          <span className="text-2xl">📜</span>
          <h3 className="text-lg font-bold uppercase font-heading tracking-widest">Sheriff&apos;s Bulletin</h3>
        </div>
        
        <div className="min-h-[80px] flex items-center italic">
          <p className="text-base font-medium leading-relaxed opacity-90 transition-opacity duration-500 key-fade-in" key={index}>
            &quot;{BULLETINS[index]}&quot;
          </p>
        </div>
        
        <div className="mt-4 flex justify-between items-center text-[10px] uppercase font-bold tracking-tighter opacity-50">
          <span>Official Proclamation</span>
          <span>Property of the State</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .key-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

export interface DispatchEvent {
  id: number | string;
  icon: string;
  date: string;
  text: string;
  isNew?: boolean;
}

const FAKE_ALERTS = [
  "New cards spotted in the wilderness!",
  "A bounty hunter has entered the town.",
  "The poker table is heating up...",
  "Flash sale at the Trading Post!",
  "Rattlesnake sighting near the creek bed.",
  "A mysterious stranger arrived at sundown.",
];

interface DispatchFeedProps {
  initialEvents?: DispatchEvent[];
}

export default function DispatchFeed({ initialEvents = [] }: DispatchFeedProps) {
  const SEED_EVENTS: DispatchEvent[] = initialEvents.length > 0 ? initialEvents : [
    { id: 1, icon: '🌵', date: 'APRIL 28, 2026', text: 'Expansion pack "Frontier Legends" is now live. Claim yours at the Vault.' },
    { id: 2, icon: '💰', date: 'APRIL 27, 2026', text: 'Gold mining is at an all-time high. Poker stakes are rising in the local Saloon.' },
    { id: 3, icon: '🐎', date: 'APRIL 26, 2026', text: 'A wild stallion was spotted near the trading post. Catch it if you can!' },
  ];

  const [events, setEvents] = useState<DispatchEvent[]>(SEED_EVENTS);

  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent: DispatchEvent = {
        id: Date.now(),
        icon: '✉️',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase(),
        text: FAKE_ALERTS[Math.floor(Math.random() * FAKE_ALERTS.length)],
        isNew: true,
      };
      setEvents(prev => [newEvent, ...prev.slice(0, 3)]);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel-pixel border-rust-900 bg-rust-950/40 py-10 px-8 relative overflow-hidden">
      <div className="flex justify-between items-center border-b-4 border-rust-900 pb-4 mb-8">
        <h2 className="text-3xl font-heading tracking-[0.2em] text-terracotta-400 uppercase">Dispatch</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm text-terracotta-400 font-bold uppercase tracking-widest">Live Telegram</span>
        </div>
      </div>

      <div className="space-y-8 relative">
        {events.map((event) => (
          <div
            key={event.id}
            className={`flex gap-6 items-start p-4 transition-all duration-700 ${
              event.isNew
                ? 'bg-rust-900/40 border-l-4 border-terracotta-400'
                : 'opacity-80 hover:opacity-100'
            }`}
            style={event.isNew ? { animation: 'slideIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards' } : {}}
          >
            <div className="w-14 h-14 bg-rust-900 border-2 border-sand-400/20 shrink-0 flex items-center justify-center text-3xl shadow-lg">
              {event.icon}
            </div>
            <div className="space-y-1 pt-1 flex-1">
              <p className="text-xs text-sand-600 font-bold uppercase tracking-[0.2em] flex justify-between">
                {event.date}
                {event.isNew && <span className="text-terracotta-400 animate-bounce">NEW</span>}
              </p>
              <p className="text-lg text-sand-200 leading-tight font-medium">{event.text}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

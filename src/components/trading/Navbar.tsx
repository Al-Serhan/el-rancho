'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSound } from '@/hooks/useSound';

export default function Navbar({ gold }: { gold: number }) {
  const pathname = usePathname();
  const { isMuted, toggleMute } = useSound();

  const tabs = [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    { name: 'Trades', href: '/dashboard/trades', icon: '🤝' },
    { name: 'Cards', href: '/dashboard/collection', icon: '🃏' },
    { name: 'Poker', href: '/dashboard/poker', icon: '🎲' },
    { name: 'Top', href: '/dashboard/leaderboard', icon: '🥇' },
  ];

  return (
    <nav className="w-full bg-rust-800 border-b-8 border-rust-900 p-4 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4 px-2">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="text-2xl font-heading text-terracotta-400 group-hover:scale-110 transition-transform tracking-widest">
            EL RANCHO
          </div>
        </Link>
        
        <div className="flex items-center gap-4 xl:gap-6">
          <div className="flex flex-row flex-wrap lg:flex-nowrap justify-center gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  btn-pixel py-3 px-4 flex items-center gap-2
                  ${pathname === tab.href ? 'bg-sand-400 text-rust-900 border-sand-600' : 'bg-rust-900 border-rust-950 text-sand-300 hover:text-sand-200 hover:bg-rust-800'}
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden md:inline font-bold tracking-tight">{tab.name}</span>
              </Link>
            ))}
          </div>

          <div className="h-10 w-px bg-rust-900 hidden lg:block"></div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMute}
              className="btn-pixel py-2 px-3 bg-rust-900 border-rust-950 text-sand-300 hover:bg-rust-800"
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <div className="panel-pixel py-2 px-6 bg-rust-900/50 border-sand-500/30 flex items-center gap-3 shadow-none">
              <span className="text-2xl">💰</span>
              <span className="font-heading text-sand-300 text-2xl tracking-tighter">{gold}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

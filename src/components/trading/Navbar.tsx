'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ gold }: { gold: number }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    { name: 'Trades', href: '/dashboard/trades', icon: '🤝' },
    { name: 'Cards', href: '/dashboard/collection', icon: '🃏' },
    { name: 'Poker', href: '/dashboard/poker', icon: '🎲' },
    { name: 'Top', href: '/dashboard/leaderboard', icon: '🥇' },
  ];

  return (
    <nav className="w-full bg-rust-800 border-b-8 border-rust-900 p-4 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="text-2xl font-heading text-terracotta-400 group-hover:scale-110 transition-transform tracking-widest">
            EL RANCHO
          </div>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-wrap justify-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  btn-pixel text-[10px] py-2 px-3 flex items-center gap-2
                  ${pathname === tab.href ? 'bg-sand-400 text-rust-900 border-sand-600' : 'bg-rust-700 border-rust-900 text-sand-500'}
                `}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </Link>
            ))}
          </div>

          <div className="h-10 w-px bg-rust-900 hidden md:block"></div>

          <div className="panel-pixel py-1 px-4 bg-rust-900/50 border-sand-500/30 flex items-center gap-3 shadow-none">
            <span className="text-xl">💰</span>
            <span className="font-heading text-sand-300 text-xl tracking-tighter">{gold}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

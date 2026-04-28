'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Home', href: '/dashboard' },
    { name: 'Trading Post', href: '/dashboard/trades' },
    { name: 'Collection', href: '/dashboard/collection' },
    { name: 'Bounties', href: '#', disabled: true },
  ];

  return (
    <nav className="w-full bg-rust-800 border-b-8 border-rust-900 p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/dashboard" className="text-2xl font-heading text-terracotta-400 hover:scale-105 transition-transform">
          EL RANCHO
        </Link>
        
        <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                btn-pixel text-xs py-2 px-4 
                ${pathname === tab.href ? 'bg-sand-400 text-rust-900 border-sand-600' : ''}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
              `}
              onClick={(e) => tab.disabled && e.preventDefault()}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

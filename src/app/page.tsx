import LoginButton from '@/components/LoginButton';
import EmailLogin from '@/components/EmailLogin';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 75}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() > 0.8 ? 3 : 2,
  delay: `${(Math.random() * 6).toFixed(1)}s`,
  duration: `${(2 + Math.random() * 4).toFixed(1)}s`,
}));

const MESAS = [
  { left: '-2%',  width: '18%', height: '180px', color: '#1a0a06' },
  { left: '10%',  width: '14%', height: '220px', color: '#200d08' },
  { left: '22%',  width: '20%', height: '150px', color: '#1a0a06' },
  { left: '55%',  width: '22%', height: '200px', color: '#200d08' },
  { left: '70%',  width: '16%', height: '170px', color: '#1a0a06' },
  { left: '84%',  width: '20%', height: '140px', color: '#200d08' },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0a0408 0%, #1a0608 35%, #4a1515 65%, #a23520 85%, #30140f 100%)' }}
    >
      {/* ── Star Field ── */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map(s => (
          <div
            key={s.id}
            className="absolute rounded-full bg-amber-100 animate-twinkle"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>

      {/* ── Moon ── */}
      <div
        className="absolute pointer-events-none rounded-full opacity-80"
        style={{
          top: '8%', right: '12%',
          width: '64px', height: '64px',
          background: 'radial-gradient(circle at 35% 35%, #fffbe6, #f4c842)',
          boxShadow: '0 0 40px 10px rgba(244,200,66,0.15)',
        }}
      />

      {/* ── Dust Particles ── */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-amber-700/30 animate-float-up pointer-events-none"
          style={{
            bottom: `${10 + i * 8}%`,
            left: `${10 + i * 12}%`,
            width: `${4 + i * 2}px`,
            height: `${4 + i * 2}px`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${5 + i * 0.7}s`,
          }}
        />
      ))}

      {/* ── Mesa Silhouettes ── */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '220px' }}>
        {MESAS.map((m, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{
              left: m.left,
              width: m.width,
              height: m.height,
              background: m.color,
              clipPath: 'polygon(5% 100%, 0% 55%, 8% 40%, 20% 30%, 35% 25%, 50% 30%, 65% 22%, 80% 28%, 92% 38%, 100% 55%, 95% 100%)',
            }}
          />
        ))}
        {/* Ground strip */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-rust-950" />
      </div>

      {/* ── Rolling Tumbleweed ── */}
      <div
        className="absolute pointer-events-none animate-tumbleweed"
        style={{ bottom: '50px', width: '40px', height: '40px', animationDelay: '4s' }}
      >
        <div className="w-full h-full rounded-full border-4 border-amber-800/70 bg-transparent"
          style={{ boxShadow: 'inset 0 0 8px rgba(139,90,43,0.5)' }}>
          <div className="absolute inset-2 border-2 border-amber-900/50 rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-800/50" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-amber-800/50" />
        </div>
      </div>
      <div
        className="absolute pointer-events-none animate-tumbleweed"
        style={{ bottom: '52px', width: '28px', height: '28px', animationDelay: '11s', animationDuration: '22s' }}
      >
        <div className="w-full h-full rounded-full border-4 border-amber-800/60 bg-transparent" />
      </div>

      {/* ── Main Panel ── */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Title Block */}
        <div className="text-center mb-8 space-y-2">
          <p className="text-terracotta-400 uppercase tracking-[0.4em] text-lg font-bold font-pixel animate-pulse">
            ✦ Est. 1849 ✦
          </p>
          <h1
            className="font-heading text-6xl md:text-7xl tracking-tight"
            style={{
              color: '#F4A460',
              textShadow: '4px 4px 0 #30140f, 0 0 40px rgba(226,114,91,0.4)',
            }}
          >
            EL<br />RANCHO
          </h1>
          <p className="text-sand-400 text-xl font-pixel max-w-xs mx-auto leading-relaxed">
            Welcome to the frontier, partner.<br />
            Stake your claim. Trade your cards.<br />
            Become a legend of the West.
          </p>
        </div>

        {/* Login Panel */}
        <div
          className="panel-pixel flex flex-col items-center gap-6 py-8"
          style={{ background: 'rgba(30,10,5,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div className="w-full border-b-2 border-rust-900 pb-4 text-center">
            <p className="text-terracotta-400 uppercase tracking-[0.3em] text-sm font-bold">
              [ Ride Into Town ]
            </p>
          </div>
          <LoginButton />
          <EmailLogin />
        </div>
      </div>
    </main>
  );
}

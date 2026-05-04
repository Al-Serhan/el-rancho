import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import SheriffBulletin from '@/components/dashboard/SheriffBulletin';
import DispatchFeed from '@/components/dashboard/DispatchFeed';

export const revalidate = 0;

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'Farmer';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || '/default-avatar.png';
  const username = profile?.username || user.user_metadata?.full_name || 'Anonymous Cowboy';
  const honor = profile?.honor || 0;

  // Improved Honor System Logic
  let statusName = 'Greenhorn';
  let badge = '🏜️';
  let honorColor = 'bg-gray-600';
  let honorText = 'Just passin\' through.';

  if (honor < 0) {
    statusName = 'Outlaw';
    badge = '💀';
    honorColor = 'bg-red-700 shadow-[0_0_20px_rgba(185,28,28,0.6)]';
    honorText = 'Wanted in three counties.';
  } else if (honor >= 150) {
    statusName = 'Mythic Legend';
    badge = '👑';
    honorColor = 'bg-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.8)] animate-pulse';
    honorText = 'Stories will be told for a century.';
  } else if (honor >= 100) {
    statusName = 'Living Legend';
    badge = '⭐';
    honorColor = 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]';
    honorText = 'A name known by every drifter.';
  } else if (honor >= 70) {
    statusName = 'Sheriff\'s Choice';
    badge = '🎖️';
    honorColor = 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
    honorText = 'The law is on your side.';
  } else if (honor >= 40) {
    statusName = 'Honorable';
    badge = '⚖️';
    honorColor = 'bg-green-600 shadow-[0_0_15px_rgba(22,163,74,0.4)]';
    honorText = 'A man of your word.';
  } else if (honor >= 15) {
    statusName = 'Known Drifter';
    badge = '🐎';
    honorColor = 'bg-teal-600 shadow-[0_0_10px_rgba(13,148,136,0.3)]';
    honorText = 'Starting to make a name.';
  }

  const honorPercent = Math.min(100, Math.max(5, (honor / 150) * 100));

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-12 grid lg:grid-cols-12 gap-12 animate-in fade-in zoom-in-95 duration-700 relative min-h-screen">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-[-1]">
        <Image 
          src="/backgrounds/frontier_sunset.png" 
          alt="Frontier Background" 
          fill 
          className="object-cover opacity-30 pixelated grayscale-[30%]" 
          unoptimized 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80"></div>
      </div>

      {/* Sidebar: Profile Info */}
      <div className="lg:col-span-4 space-y-8">
        <div className="panel-pixel bg-rust-900/80 border-sand-500/40 flex flex-col items-center">
          <div className="w-full flex justify-between items-center border-b-2 border-rust-950/50 pb-4 mb-8 px-2">
            <span className="text-xl opacity-40">#{profile?.id.slice(0, 4)}</span>
            <h2 className="text-xl font-heading tracking-widest text-sand-400 uppercase">Identity</h2>
            <span className="text-xl opacity-40">WEST</span>
          </div>
          
          <div className="relative w-48 h-48 group mb-8">
            <div className="absolute -inset-2 bg-gradient-to-r from-terracotta-600 to-amber-600 opacity-20 group-hover:opacity-40 blur-xl transition-opacity"></div>
            <Image 
              src={avatarUrl} 
              alt="Avatar" 
              fill
              className="border-4 border-sand-400 pixelated shadow-2xl relative z-10 bg-rust-950 object-cover" 
              unoptimized
            />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-rust-950 border-4 border-sand-400 flex items-center justify-center text-3xl z-20 shadow-xl">
              {badge}
            </div>
          </div>

          <div className="space-y-3 text-center mb-8">
            <h3 className="text-4xl font-heading text-white tracking-tight break-all px-2">{username}</h3>
            <p className="text-terracotta-400 uppercase text-lg font-bold tracking-[0.2em]">{role}</p>
          </div>

          {/* Improved Honor Bar */}
          <div className="w-full pt-8 border-t-2 border-rust-950 flex flex-col gap-4 px-6 mb-4">
             <div className="flex justify-between items-end">
               <div className="flex flex-col">
                 <span className="text-xs uppercase text-sand-600 font-bold tracking-widest">Town Status</span>
                 <span className="text-xl text-sand-200 font-heading tracking-wide uppercase">{statusName}</span>
               </div>
               <span className="text-sm font-bold text-sand-500 mb-1">{honor} / 150 LP</span>
             </div>
             
             <div className="h-6 w-full bg-rust-950 border-2 border-rust-800 p-1 rounded-sm relative group">
               <div className={`h-full transition-all duration-1000 ease-out ${honorColor}`} style={{ width: `${honorPercent}%` }}>
                 <div className="w-full h-full bg-[url('/grain.png')] opacity-20"></div>
               </div>
               {/* Notches */}
               <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                 {[1, 2, 3, 4].map(i => <div key={i} className="w-px h-full bg-black/40"></div>)}
               </div>
             </div>
             <p className="text-xs italic text-sand-600 text-center tracking-tight">&quot;{honorText}&quot;</p>
          </div>

          <form action="/api/auth/signout" method="POST" className="pt-6 pb-4 w-full flex justify-center">
            <button type="submit" className="text-xs text-sand-700 hover:text-terracotta-400 transition-colors uppercase tracking-[0.2em] font-bold underline underline-offset-4">
              [ Ride Out of Town ]
            </button>
          </form>
        </div>

        <SheriffBulletin />
      </div>

      {/* Main Content: Action Zone */}
      <div className="lg:col-span-8 space-y-12">
        <div className="grid md:grid-cols-2 gap-8">
          <Link href="/dashboard/trades" className="group">
            <div className="panel-pixel h-full hover:border-cyan-400 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-900/50 border-sand-400/20 py-16 flex flex-col items-center justify-center space-y-6 group-hover:bg-rust-800/80">
              <div className="text-6xl group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">🤝</div>
              <h2 className="text-3xl font-heading tracking-widest text-sand-300 group-hover:text-cyan-400 transition-colors">TRADING POST</h2>
              <p className="text-sm text-sand-600 text-center px-8 uppercase font-bold tracking-widest opacity-60 group-hover:opacity-100">Swap your legendary artifacts.</p>
            </div>
          </Link>

          <Link href="/dashboard/collection" className="group">
            <div className="panel-pixel h-full hover:border-amber-400 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-900/50 border-sand-400/20 py-16 flex flex-col items-center justify-center space-y-6 group-hover:bg-rust-800/80">
              <div className="text-6xl group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all">🃏</div>
              <h2 className="text-3xl font-heading tracking-widest text-sand-300 group-hover:text-amber-400 transition-colors uppercase">My Vault</h2>
              <p className="text-sm text-sand-600 text-center px-8 uppercase font-bold tracking-widest opacity-60 group-hover:opacity-100">Browse your card stash.</p>
            </div>
          </Link>

          <Link href="/dashboard/poker" className="group">
            <div className="panel-pixel h-full hover:border-green-500 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-900/50 border-sand-400/20 py-16 flex flex-col items-center justify-center space-y-6 group-hover:bg-rust-800/80">
              <div className="text-6xl group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">🎲</div>
              <h2 className="text-3xl font-heading tracking-widest text-sand-300 group-hover:text-green-500 transition-colors uppercase">The Saloon</h2>
              <p className="text-sm text-sand-600 text-center px-8 uppercase font-bold tracking-widest opacity-60 group-hover:opacity-100">Win gold in Texas Hold&apos;em.</p>
            </div>
          </Link>

          <Link href="/dashboard/leaderboard" className="group">
            <div className="panel-pixel h-full hover:border-indigo-400 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-900/50 border-sand-400/20 py-16 flex flex-col items-center justify-center space-y-6 group-hover:bg-rust-800/80">
              <div className="text-6xl group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(129,140,248,0.4)] transition-all">🥇</div>
              <h2 className="text-3xl font-heading tracking-widest text-sand-300 group-hover:text-indigo-400 transition-colors uppercase">Hall of Fame</h2>
              <p className="text-sm text-sand-600 text-center px-8 uppercase font-bold tracking-widest opacity-60 group-hover:opacity-100">The town&apos;s wealthiest drifters.</p>
            </div>
          </Link>
        </div>

        <DispatchFeed />
      </div>
    </main>
  );
}

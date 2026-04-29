import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

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
  const gold = profile?.gold_coins ?? 100;

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-12 grid lg:grid-cols-12 gap-12 animate-in fade-in zoom-in-95 duration-700">
      
      {/* Sidebar: Profile Info */}
      <div className="lg:col-span-4 space-y-8">
        <div className="panel-pixel bg-gradient-to-b from-rust-800 to-rust-900 border-sand-500 flex flex-col items-center">
          <h2 className="text-2xl border-b-4 border-rust-900 pb-4 mb-8 font-heading tracking-widest text-sand-300 w-full text-center uppercase">Profile</h2>
          
          <div className="relative w-48 h-48 group mb-8">
            <Image 
              src={avatarUrl} 
              alt="Avatar" 
              fill
              className="border-4 border-sand-400 pixelated shadow-2xl relative z-10 bg-rust-900 object-cover" 
              unoptimized
            />
          </div>

          <div className="space-y-3 text-center mb-8">
            <h3 className="text-4xl font-heading text-white tracking-tight break-all px-2">{username}</h3>
            <p className="text-terracotta-400 uppercase text-lg font-bold tracking-[0.2em]">{role}</p>
          </div>

          <div className="w-full pt-8 border-t-2 border-rust-900/50 flex flex-col gap-4 px-6">
             <div className="flex justify-between items-center text-lg uppercase text-sand-500 font-bold">
               <span>Town Status</span>
               <span>Honorable</span>
             </div>
             <div className="h-4 w-full bg-rust-950 border-2 border-rust-800 p-0.5">
               <div className="h-full w-2/3 bg-green-600 shadow-[0_0_15px_rgba(22,163,74,0.5)]"></div>
             </div>
          </div>

          <form action="/api/auth/signout" method="POST" className="pt-10 w-full flex justify-center">
            <button type="submit" className="text-sm text-sand-600 hover:text-terracotta-400 transition-colors uppercase tracking-widest font-bold underline">
              [ Leave Town ]
            </button>
          </form>
        </div>

        <div className="panel-pixel bg-sand-400 border-sand-600 text-rust-900 shadow-none py-10 px-10">
          <h3 className="text-lg font-bold uppercase mb-4 font-heading border-b-2 border-rust-900/20 pb-2">Sheriff&apos;s Bulletin</h3>
          <p className="text-sm font-medium leading-relaxed italic opacity-90">
            &quot;The desert is vast, but the law is long. Keep your cards close and your poker face steady.&quot;
          </p>
        </div>
      </div>

      {/* Main Content: Action Zone */}
      <div className="lg:col-span-8 space-y-12">
        <div className="grid md:grid-cols-2 gap-8">
          <Link href="/dashboard/trades" className="group">
            <div className="panel-pixel h-full hover:border-terracotta-400 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-800 border-sand-400/40 py-16 flex flex-col items-center justify-center space-y-6">
              <div className="text-6xl group-hover:scale-110 transition-transform">🤝</div>
              <h2 className="text-3xl font-heading tracking-widest text-sand-300 group-hover:text-terracotta-400 transition-colors">TRADING POST</h2>
              <p className="text-lg text-sand-600 text-center px-8 uppercase font-bold tracking-tight">Swap your legendary artifacts.</p>
            </div>
          </Link>

          <Link href="/dashboard/collection" className="group">
            <div className="panel-pixel h-full hover:border-sand-300 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-800 border-sand-400/40 py-16 flex flex-col items-center justify-center space-y-6">
              <div className="text-6xl group-hover:scale-110 transition-transform">🃏</div>
              <h2 className="text-3xl font-heading tracking-widest text-sand-300 group-hover:text-sand-300 transition-colors uppercase">My Vault</h2>
              <p className="text-lg text-sand-600 text-center px-8 uppercase font-bold tracking-tight">Browse your card stash.</p>
            </div>
          </Link>

          <Link href="/dashboard/poker" className="group">
            <div className="panel-pixel h-full hover:border-green-500 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-800 border-sand-400/40 py-16 flex flex-col items-center justify-center space-y-6">
              <div className="text-6xl group-hover:scale-110 transition-transform">🎲</div>
              <h2 className="text-3xl font-heading tracking-widest text-sand-300 group-hover:text-green-500 transition-colors uppercase">The Saloon</h2>
              <p className="text-lg text-sand-600 text-center px-8 uppercase font-bold tracking-tight">Win gold in Texas Hold&apos;em.</p>
            </div>
          </Link>

          <Link href="/dashboard/leaderboard" className="group">
            <div className="panel-pixel h-full hover:border-yellow-400 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-800 border-sand-400/40 py-16 flex flex-col items-center justify-center space-y-6">
              <div className="text-6xl group-hover:scale-110 transition-transform">🥇</div>
              <h2 className="text-3xl font-heading tracking-widest text-sand-300 group-hover:text-yellow-400 transition-colors uppercase">Hall of Fame</h2>
              <p className="text-lg text-sand-600 text-center px-8 uppercase font-bold tracking-tight">The town&apos;s wealthiest drifters.</p>
            </div>
          </Link>
        </div>

        <div className="panel-pixel border-rust-900 bg-rust-950/30 py-12">
          <div className="flex justify-between items-center border-b-4 border-rust-900 pb-4 mb-8">
            <h2 className="text-3xl font-heading tracking-[0.2em] text-terracotta-400 uppercase">Dispatch</h2>
            <span className="text-lg bg-terracotta-400 text-rust-950 px-3 py-1 font-bold uppercase tracking-widest">Live</span>
          </div>
          <div className="space-y-10">
            <div className="flex gap-6 items-start">
               <div className="w-16 h-16 bg-rust-800 border-4 border-sand-400/20 shrink-0 flex items-center justify-center text-4xl">🌵</div>
               <div className="space-y-2 pt-1">
                 <p className="text-lg text-sand-600 font-bold uppercase tracking-[0.2em]">APRIL 28, 2026</p>
                 <p className="text-xl text-sand-200 leading-tight">Expansion pack &quot;Frontier Legends&quot; is now live. Claim yours at the Vault.</p>
               </div>
            </div>
            <div className="flex gap-6 items-start">
               <div className="w-16 h-16 bg-rust-800 border-4 border-sand-400/20 shrink-0 flex items-center justify-center text-4xl">💰</div>
               <div className="space-y-2 pt-1">
                 <p className="text-lg text-sand-600 font-bold uppercase tracking-[0.2em]">APRIL 27, 2026</p>
                 <p className="text-xl text-sand-200 leading-tight">Gold mining is at an all-time high. Poker stakes are rising in the local Saloon.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

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

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8 grid lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-700">
      
      {/* Sidebar: Profile Info */}
      <div className="lg:col-span-4 space-y-6">
        <div className="panel-pixel bg-gradient-to-b from-rust-800 to-rust-900 border-sand-500 shadow-[12px_12px_0_0_rgba(0,0,0,0.4)]">
          <div className="absolute top-2 right-2 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-sand-600/30 rounded-full"></div>
            ))}
          </div>
          <h2 className="text-xl border-b-4 border-rust-900 pb-2 mb-6 font-heading tracking-widest text-sand-300">USER PROFILE</h2>
          
          <div className="relative mx-auto w-40 h-40 group mb-6">
            <div className="absolute -inset-2 bg-gradient-to-tr from-terracotta-600 to-sand-400 opacity-20 group-hover:opacity-40 blur transition-opacity"></div>
            <Image 
              src={avatarUrl} 
              alt="Avatar" 
              fill
              className="border-4 border-sand-400 pixelated shadow-2xl relative z-10 bg-rust-900 object-cover" 
              unoptimized
            />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-heading text-white tracking-tight">{username}</h3>
            <p className="text-terracotta-400 uppercase text-xs font-bold tracking-[0.2em]">{role}</p>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-rust-900/50 flex flex-col gap-3">
             <div className="flex justify-between items-center text-[10px] uppercase text-sand-500 font-bold">
               <span>Reputation</span>
               <span>Honorable</span>
             </div>
             <div className="h-3 w-full bg-rust-950 border-2 border-rust-800 p-0.5">
               <div className="h-full w-2/3 bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.5)]"></div>
             </div>
          </div>

          <form action="/api/auth/signout" method="POST" className="pt-6">
            <button type="submit" className="text-[10px] text-sand-600 hover:text-terracotta-400 transition-colors uppercase tracking-widest font-bold">
              [ Leave Town ]
            </button>
          </form>
        </div>

        <div className="panel-pixel bg-sand-400 border-sand-600 text-rust-900 shadow-none">
          <div className="absolute top-2 left-2 text-xl opacity-20">📜</div>
          <h3 className="text-sm font-bold uppercase mb-2 font-heading">Sheriff&apos;s Bulletin</h3>
          <p className="text-xs font-medium leading-relaxed italic opacity-80">
            &quot;The desert is vast, but the law is long. Keep your inventory locked and your poker face steady. New bounties coming next moon.&quot;
          </p>
        </div>
      </div>

      {/* Main Content: Action Zone */}
      <div className="lg:col-span-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/dashboard/trades" className="group">
            <div className="panel-pixel h-full hover:border-terracotta-400 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-800 border-sand-400/40 py-12 flex flex-col items-center justify-center space-y-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">🤝</div>
              <h2 className="text-2xl font-heading tracking-widest text-sand-300 group-hover:text-terracotta-400 transition-colors">TRADING POST</h2>
              <div className="h-1 w-12 bg-rust-900 group-hover:w-20 transition-all"></div>
              <p className="text-[10px] text-sand-600 text-center px-8 uppercase font-bold tracking-tighter">Swap iron, cards, and favors.</p>
            </div>
          </Link>

          <Link href="/dashboard/collection" className="group">
            <div className="panel-pixel h-full hover:border-sand-300 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-800 border-sand-400/40 py-12 flex flex-col items-center justify-center space-y-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">🃏</div>
              <h2 className="text-2xl font-heading tracking-widest text-sand-300 group-hover:text-sand-300 transition-colors">MY VAULT</h2>
              <div className="h-1 w-12 bg-rust-900 group-hover:w-20 transition-all"></div>
              <p className="text-[10px] text-sand-600 text-center px-8 uppercase font-bold tracking-tighter">Admire your legendary stash.</p>
            </div>
          </Link>

          <Link href="/dashboard/poker" className="group">
            <div className="panel-pixel h-full hover:border-green-500 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-800 border-sand-400/40 py-12 flex flex-col items-center justify-center space-y-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">🎲</div>
              <h2 className="text-2xl font-heading tracking-widest text-sand-300 group-hover:text-green-500 transition-colors uppercase">The Saloon</h2>
              <div className="h-1 w-12 bg-rust-900 group-hover:w-20 transition-all"></div>
              <p className="text-[10px] text-sand-600 text-center px-8 uppercase font-bold tracking-tighter">Try your hand at 5-Card Draw.</p>
            </div>
          </Link>

          <Link href="/dashboard/leaderboard" className="group">
            <div className="panel-pixel h-full hover:border-yellow-400 hover:translate-x-1 hover:-translate-y-1 transition-all bg-rust-800 border-sand-400/40 py-12 flex flex-col items-center justify-center space-y-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">🥇</div>
              <h2 className="text-2xl font-heading tracking-widest text-sand-300 group-hover:text-yellow-400 transition-colors uppercase">Hall of Fame</h2>
              <div className="h-1 w-12 bg-rust-900 group-hover:w-20 transition-all"></div>
              <p className="text-[10px] text-sand-600 text-center px-8 uppercase font-bold tracking-tighter">The finest drifters in the West.</p>
            </div>
          </Link>
        </div>

        <div className="panel-pixel border-rust-900 bg-rust-950/30">
          <div className="flex justify-between items-center border-b-4 border-rust-900 pb-2 mb-6">
            <h2 className="text-xl font-heading tracking-[0.2em] text-terracotta-400 uppercase">Local Dispatch</h2>
            <span className="text-[10px] bg-terracotta-400 text-rust-950 px-2 py-0.5 font-bold uppercase">LIVE</span>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
               <div className="w-12 h-12 bg-rust-800 border-2 border-sand-400/20 shrink-0 flex items-center justify-center text-2xl">🌵</div>
               <div className="space-y-1">
                 <p className="text-[10px] text-sand-600 font-bold uppercase tracking-widest">APRIL 28, 2026</p>
                 <p className="text-sm text-sand-200 leading-tight">Expansion pack &quot;Frontier Legends&quot; is now being issued by the Sheriff. Claim yours at the Vault.</p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="w-12 h-12 bg-rust-800 border-2 border-sand-400/20 shrink-0 flex items-center justify-center text-2xl">💰</div>
               <div className="space-y-1">
                 <p className="text-[10px] text-sand-600 font-bold uppercase tracking-widest">APRIL 27, 2026</p>
                 <p className="text-sm text-sand-200 leading-tight">Gold mining is at an all-time high. Poker stakes are rising in the local Saloon.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

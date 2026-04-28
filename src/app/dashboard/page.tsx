import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

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
    <main className="max-w-6xl mx-auto p-4 md:p-8 grid lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      
      {/* Sidebar: Profile Info */}
      <div className="lg:col-span-4 space-y-6">
        <div className="panel-pixel text-center space-y-4">
          <h2 className="text-xl border-b-4 border-rust-900 pb-2">Your Identity</h2>
          <div className="relative group mx-auto w-32 h-32">
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-full h-full border-4 border-sand-400 pixelated shadow-lg transition-transform group-hover:scale-105" 
            />
            <div className="absolute inset-0 border-2 border-white/10 pointer-events-none"></div>
          </div>
          <div>
            <h3 className="text-lg">{username}</h3>
            <p className="text-terracotta-400 uppercase text-sm mt-1">{role}</p>
          </div>
          <form action="/api/auth/signout" method="POST" className="pt-2">
            <button type="submit" className="text-xs text-sand-500 hover:text-terracotta-400 transition-colors uppercase underline">
              Leave the Rancho
            </button>
          </form>
        </div>

        <div className="panel-pixel bg-terracotta-600/10 border-terracotta-600">
          <h3 className="text-sm uppercase mb-2">Sheriff&apos;s Tip</h3>
          <p className="text-xs text-sand-300 leading-relaxed">
            Keep your iron ironed and your cards close. A real cowboy never shows his full hand at the Saloon.
          </p>
        </div>
      </div>

      {/* Main Content: Action Zone */}
      <div className="lg:col-span-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/dashboard/trades" className="group">
            <div className="panel-pixel h-full hover:border-terracotta-400 transition-colors flex flex-col items-center justify-center py-10 space-y-4">
              <div className="text-4xl group-hover:scale-110 transition-transform">🤝</div>
              <h2 className="group-hover:text-terracotta-400 transition-colors">Trading Post</h2>
              <p className="text-xs text-sand-500 text-center px-4">Swap cards with other cowboys across the frontier.</p>
            </div>
          </Link>

          <Link href="/dashboard/collection" className="group">
            <div className="panel-pixel h-full hover:border-sand-300 transition-colors flex flex-col items-center justify-center py-10 space-y-4">
              <div className="text-4xl group-hover:scale-110 transition-transform">🃏</div>
              <h2 className="group-hover:text-sand-300 transition-colors">Collection</h2>
              <p className="text-xs text-sand-500 text-center px-4">Admire your growing stash of rare artifacts and spurs.</p>
            </div>
          </Link>
        </div>

        <div className="panel-pixel">
          <h2 className="text-xl mb-4 border-b-4 border-rust-900 pb-2 flex items-center gap-2">
            <span className="text-terracotta-400">📜</span> Frontier News
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-sand-400 pl-4 py-1">
              <p className="text-xs text-sand-500">APRIL 28, 2026</p>
              <p className="text-sm">New "Golden Lasso" cards spotted in the Southern Canyons. Keep an eye out!</p>
            </div>
            <div className="border-l-4 border-rust-900 pl-4 py-1">
              <p className="text-xs text-sand-500">APRIL 27, 2026</p>
              <p className="text-sm">The Trading Post is officially open for business. No shootouts allowed indoors.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

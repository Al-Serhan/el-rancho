import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import AchievementsPanel from '@/components/dashboard/AchievementsPanel';

export const revalidate = 0;

const RARITY_ORDER: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 };
const RARITY_COLOR: Record<string, string> = {
  Legendary: 'text-yellow-400 border-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.3)]',
  Epic:      'text-purple-400 border-purple-500',
  Rare:      'text-blue-400   border-blue-500',
  Uncommon:  'text-green-400  border-green-600',
  Common:    'text-sand-500   border-rust-700',
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Fetch the target profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile) notFound();

  // Redirect to dashboard if viewing your own profile
  if (id === user.id) redirect('/dashboard');

  const username    = profile.username || 'Unknown Drifter';
  const avatarUrl   = profile.avatar_url || '/default-avatar.png';
  const honor       = profile.honor || 0;
  const gold        = profile.gold_coins || 0;
  const role        = profile.role || 'Farmer';

  // Honor badge
  let statusName = 'Greenhorn'; let badge = '🏜️'; let honorColor = 'bg-gray-600'; let honorText = 'Just passin\' through.';
  if (honor < 0)        { statusName = 'Outlaw';          badge = '💀'; honorColor = 'bg-red-700';    honorText = 'Wanted in three counties.'; }
  else if (honor >= 150){ statusName = 'Mythic Legend';   badge = '👑'; honorColor = 'bg-indigo-400 animate-pulse'; honorText = 'Stories will be told for a century.'; }
  else if (honor >= 100){ statusName = 'Living Legend';   badge = '⭐'; honorColor = 'bg-amber-400';   honorText = 'A name known by every drifter.'; }
  else if (honor >= 70) { statusName = 'Sheriff\'s Choice';badge = '🎖️'; honorColor = 'bg-blue-500';   honorText = 'The law is on your side.'; }
  else if (honor >= 40) { statusName = 'Honorable';       badge = '⚖️'; honorColor = 'bg-green-600';  honorText = 'A man of your word.'; }
  else if (honor >= 15) { statusName = 'Known Drifter';   badge = '🐎'; honorColor = 'bg-teal-600';   honorText = 'Starting to make a name.'; }
  const honorPercent = Math.min(100, Math.max(5, (honor / 150) * 100));

  // Fetch their inventory
  const { data: inventory } = await supabase
    .from('user_inventory')
    .select('id, user_id, card_id, acquired_at, cards(*)')
    .eq('user_id', id);

  const cards = (inventory || [])
    .map(i => (i.cards as unknown) as { id: string; name: string; rarity: string; image_url: string | null })
    .sort((a, b) => (RARITY_ORDER[a.rarity] ?? 5) - (RARITY_ORDER[b.rarity] ?? 5));

  // Counts for achievements
  const inventoryCount = cards.length;

  const { count: tradeCount } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`initiator_id.eq.${id},receiver_id.eq.${id}`);

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-12 animate-in fade-in duration-500 relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 z-[-1]">
        <Image src="/backgrounds/frontier_sunset.png" alt="bg" fill className="object-cover opacity-20 pixelated grayscale-[40%]" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
      </div>

      {/* Back nav */}
      <div className="mb-8">
        <Link href="/dashboard/leaderboard" className="btn-pixel py-2 px-4 text-sm">
          ← Hall of Fame
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* LEFT — Profile Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="panel-pixel bg-rust-900/80 border-sand-500/40 flex flex-col items-center">
            <div className="w-full flex justify-between items-center border-b-2 border-rust-950/50 pb-4 mb-8 px-2">
              <span className="text-xl opacity-40">#{id.slice(0, 4)}</span>
              <h2 className="text-xl font-heading tracking-widest text-sand-400 uppercase">Profile</h2>
              <span className="text-xl opacity-40">WEST</span>
            </div>

            {/* Avatar */}
            <div className="relative w-48 h-48 group mb-8">
              <div className="absolute -inset-2 bg-gradient-to-r from-terracotta-600 to-amber-600 opacity-20 group-hover:opacity-40 blur-xl transition-opacity" />
              <Image src={avatarUrl} alt={username} fill className="border-4 border-sand-400 pixelated shadow-2xl relative z-10 bg-rust-950 object-cover" unoptimized />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-rust-950 border-4 border-sand-400 flex items-center justify-center text-3xl z-20 shadow-xl">
                {badge}
              </div>
            </div>

            {/* Name + Role */}
            <div className="space-y-3 text-center mb-8">
              <h1 className="text-4xl font-heading text-white tracking-tight break-all px-2">{username}</h1>
              <p className="text-terracotta-400 uppercase text-lg font-bold tracking-[0.2em]">{role}</p>
            </div>

            {/* Stats Row */}
            <div className="w-full grid grid-cols-3 border-t-2 border-rust-950 divide-x-2 divide-rust-950">
              <div className="flex flex-col items-center py-4 px-2">
                <span className="text-2xl font-heading text-sand-200">{inventoryCount}</span>
                <span className="text-xs text-sand-600 uppercase tracking-wider">Cards</span>
              </div>
              <div className="flex flex-col items-center py-4 px-2">
                <span className="text-2xl font-heading text-sand-200">{honor}</span>
                <span className="text-xs text-sand-600 uppercase tracking-wider">Honor</span>
              </div>
              <div className="flex flex-col items-center py-4 px-2">
                <span className="text-2xl font-heading text-sand-200">{tradeCount || 0}</span>
                <span className="text-xs text-sand-600 uppercase tracking-wider">Trades</span>
              </div>
            </div>

            {/* Honor Bar */}
            <div className="w-full pt-6 px-6 pb-4 space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs uppercase text-sand-600 font-bold tracking-widest block">Town Status</span>
                  <span className="text-xl text-sand-200 font-heading tracking-wide uppercase">{statusName}</span>
                </div>
                <span className="text-sm font-bold text-sand-500">{honor} / 150 LP</span>
              </div>
              <div className="h-5 w-full bg-rust-950 border-2 border-rust-800 p-0.5 relative">
                <div className={`h-full transition-all duration-1000 ease-out ${honorColor}`} style={{ width: `${honorPercent}%` }} />
                <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                  {[1, 2, 3, 4].map(i => <div key={i} className="w-px h-full bg-black/40" />)}
                </div>
              </div>
              <p className="text-xs italic text-sand-600 text-center">&quot;{honorText}&quot;</p>
            </div>
          </div>

          {/* Achievements */}
          <AchievementsPanel
            honor={honor}
            gold={gold}
            inventoryCount={inventoryCount}
            tradeCount={tradeCount || 0}
          />

          {/* Trade CTA */}
          <Link
            href="/dashboard/trades"
            className="btn-pixel w-full text-center block"
          >
            🤝 Propose a Trade
          </Link>
        </div>

        {/* RIGHT — Card Collection */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between border-b-4 border-rust-900 pb-4">
            <div>
              <h2 className="text-3xl font-heading uppercase tracking-tighter">
                {username}&apos;s Collection
              </h2>
              <p className="text-sand-500 text-lg">{inventoryCount} card{inventoryCount !== 1 ? 's' : ''} in their vault</p>
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="panel-pixel py-16 text-center text-sand-500">
              <p className="text-4xl mb-4">🏜️</p>
              <p>This cowboy has an empty saddlebag.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {cards.map(card => {
                const colorClass = RARITY_COLOR[card.rarity] || RARITY_COLOR.Common;
                return (
                  <div
                    key={card.id}
                    className={`panel-pixel !p-2 border-2 flex flex-col items-center gap-1 transition-all hover:scale-105 hover:-translate-y-1 ${colorClass}`}
                    title={card.name}
                  >
                    <div className="w-full aspect-square relative bg-rust-950 overflow-hidden">
                      {card.image_url ? (
                        <Image src={card.image_url} alt={card.name} fill className="pixelated object-contain p-1" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🃏</div>
                      )}
                      {/* Shimmer on Legendary */}
                      {card.rarity === 'Legendary' && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-card-shimmer" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center font-heading leading-tight w-full break-words px-1">{card.name}</p>
                    <p className={`text-xs uppercase tracking-wider font-bold ${colorClass.split(' ')[0]}`}>{card.rarity}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

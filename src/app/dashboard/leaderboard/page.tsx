import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 60; // Refresh leaderboard every 60 seconds

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch top 10 players
  const { data: topPlayers } = await supabase
    .from('profiles')
    .select('username, gold_coins, avatar_url, role')
    .order('gold_coins', { ascending: false })
    .limit(10);

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <p className="text-terracotta-400 text-sm uppercase">Wall of Fame</p>
        <h1 className="text-4xl font-heading">Top Cowboys</h1>
        <p className="text-xs text-sand-500">The wealthiest hands in the frontier.</p>
      </div>

      <div className="panel-pixel overflow-hidden p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-rust-900 text-[10px] uppercase text-sand-500 font-heading border-b-4 border-sand-400">
              <th className="p-4 w-16 text-center">Rank</th>
              <th className="p-4">Cowboy</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right">Gold</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-rust-900">
            {topPlayers?.map((player, index) => (
              <tr key={index} className={`hover:bg-rust-700/50 transition-colors ${player.username === user.user_metadata?.full_name ? 'bg-terracotta-400/10' : ''}`}>
                <td className="p-4 text-center font-heading text-xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </td>
                <td className="p-4 flex items-center gap-3">
                  <img 
                    src={player.avatar_url || '/default-avatar.png'} 
                    alt="" 
                    className="w-8 h-8 pixelated border-2 border-sand-400 bg-rust-900" 
                  />
                  <span className="font-bold">{player.username || 'Unknown Drifter'}</span>
                </td>
                <td className="p-4 text-xs uppercase text-terracotta-400">{player.role}</td>
                <td className="p-4 text-right text-sand-300 font-heading">{player.gold_coins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center text-[10px] text-sand-500 italic">
        * Leaderboard updates every minute. Keep playing to climb the ranks!
      </div>
    </main>
  );
}

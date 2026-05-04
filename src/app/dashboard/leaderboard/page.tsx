import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60;

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: topPlayers } = await supabase
    .from('profiles')
    .select('id, username, gold_coins, honor, avatar_url, role')
    .order('gold_coins', { ascending: false })
    .limit(10);

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <p className="text-terracotta-400 text-sm uppercase">Wall of Fame</p>
        <h1 className="text-4xl font-heading">Top Cowboys</h1>
        <p className="text-xs text-sand-500">The wealthiest hands in the frontier. Click a name to view their profile.</p>
      </div>

      <div className="panel-pixel overflow-hidden p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-rust-900 text-xs uppercase text-sand-500 font-heading border-b-4 border-sand-400">
              <th className="p-6 w-20 text-center">Rank</th>
              <th className="p-6 text-lg">Cowboy</th>
              <th className="p-6 text-lg">Role</th>
              <th className="p-6 text-center text-lg">Honor</th>
              <th className="p-6 text-right text-lg">Gold</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-rust-900">
            {topPlayers?.map((player, index) => {
              const isMe = player.id === user.id;
              return (
                <tr
                  key={player.id}
                  className={`transition-colors ${isMe ? 'bg-terracotta-400/10' : 'hover:bg-rust-700/50'}`}
                >
                  <td className="p-6 text-center font-heading text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="p-6">
                    {isMe ? (
                      <div className="flex items-center gap-4">
                        <Image
                          src={player.avatar_url || '/default-avatar.png'}
                          alt=""
                          width={48}
                          height={48}
                          className="pixelated border-2 border-sand-400 bg-rust-900"
                          unoptimized
                        />
                        <span className="font-bold text-lg text-sand-300">
                          {player.username || 'Unknown Drifter'} <span className="text-terracotta-400 text-sm">(You)</span>
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={`/dashboard/profile/${player.id}`}
                        className="flex items-center gap-4 group w-fit"
                      >
                        <Image
                          src={player.avatar_url || '/default-avatar.png'}
                          alt=""
                          width={48}
                          height={48}
                          className="pixelated border-2 border-sand-400 bg-rust-900 group-hover:border-terracotta-400 transition-colors"
                          unoptimized
                        />
                        <span className="font-bold text-lg group-hover:text-terracotta-400 transition-colors underline underline-offset-2 decoration-sand-600 group-hover:decoration-terracotta-400">
                          {player.username || 'Unknown Drifter'}
                        </span>
                      </Link>
                    )}
                  </td>
                  <td className="p-6 text-sm uppercase text-terracotta-400 font-bold tracking-wider">{player.role}</td>
                  <td className="p-6 text-center">
                    <span className={`font-heading text-xl ${
                      (player.honor || 0) >= 100 ? 'text-yellow-400' :
                      (player.honor || 0) >= 70  ? 'text-blue-400'   :
                      (player.honor || 0) >= 40  ? 'text-green-400'  :
                      (player.honor || 0) >= 15  ? 'text-teal-400'   :
                      (player.honor || 0) < 0    ? 'text-red-500'    : 'text-sand-600'
                    }`}>{player.honor || 0}</span>
                  </td>
                  <td className="p-6 text-right text-sand-300 font-heading text-2xl tracking-tighter">{player.gold_coins}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-center text-xs text-sand-500 italic">
        * Leaderboard updates every minute. Keep playing to climb the ranks!
      </div>
    </main>
  );
}

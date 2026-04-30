import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import PokerTable from '@/components/poker/PokerTable';

export const revalidate = 0;

export default async function PokerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('gold_coins')
    .eq('id', user.id)
    .single();

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 relative">
      <div className="fixed inset-0 z-[-1] bg-saloon-wood"></div>
      <div className="flex flex-col md:flex-row justify-between items-center border-b-8 border-rust-900 pb-4 gap-4">
        <div>
          <p className="text-terracotta-400 text-xl uppercase mb-1">The Saloon</p>
          <h1 className="text-3xl">Poker Room</h1>
        </div>
        <p className="text-lg text-sand-500 max-w-xs text-center md:text-right">
          Test your luck, partner. Jacks or better to win. High stakes, high rewards.
        </p>
      </div>

      <PokerTable initialGold={profile?.gold_coins || 0} />
    </main>
  );
}

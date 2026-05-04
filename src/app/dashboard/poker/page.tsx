import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import StakeSelector from '@/components/poker/StakeSelector';

export const revalidate = 0;

export default async function PokerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('gold_coins')
    .eq('id', user.id)
    .single();

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 relative min-h-screen">
      <div className="fixed inset-0 z-[-1]">
        <Image src="/backgrounds/saloon.png" alt="Saloon Background" fill className="object-cover opacity-40 pixelated" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center border-b-8 border-rust-900 pb-4 gap-4">
        <div>
          <p className="text-terracotta-400 text-xl uppercase mb-1">The Saloon</p>
          <h1 className="text-3xl">Poker Room</h1>
        </div>
        <p className="text-lg text-sand-500 max-w-xs text-center md:text-right">
          Test your luck, partner. Jacks or better to win. High stakes, high rewards.
        </p>
      </div>

      <StakeSelector initialGold={profile?.gold_coins || 0} />
    </main>
  );
}

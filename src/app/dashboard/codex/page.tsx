import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import CodexGrid from '@/components/trading/CodexGrid';

export const revalidate = 0;

export default async function CodexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  // Fetch every card in the game (source of truth is the DB)
  const { data: allCards } = await supabase
    .from('cards')
    .select('id, name, rarity, image_url, description')
    .order('name');

  // Fetch only this user's owned card IDs
  const { data: inventory } = await supabase
    .from('user_inventory')
    .select('card_id')
    .eq('user_id', user.id);

  const ownedIds = new Set((inventory || []).map(i => i.card_id));

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 animate-in fade-in duration-500 relative min-h-screen mb-20">
      {/* Background */}
      <div className="fixed inset-0 z-[-1]">
        <Image
          src="/backgrounds/collection.png"
          alt="Codex Background"
          fill
          className="object-cover opacity-20 pixelated"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b-8 border-rust-900 pb-6 gap-6">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-terracotta-400 text-xl uppercase tracking-[0.3em] font-bold">The Grand Archive</p>
          <h1 className="text-5xl font-heading uppercase tracking-tighter">Card Codex</h1>
          <p className="text-sand-500 text-lg max-w-md">
            Every artifact ever discovered in the Frontier. Greyed cards are still out there, waiting to be found.
          </p>
        </div>
        <Link href="/dashboard/collection" className="btn-pixel py-3 text-sm">
          My Vault
        </Link>
      </div>

      <CodexGrid allCards={allCards || []} ownedIds={ownedIds} />
    </main>
  );
}

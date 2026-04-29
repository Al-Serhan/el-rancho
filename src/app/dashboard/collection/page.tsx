import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { UserInventory } from '@/types/database';
import ClaimButton from '@/components/trading/ClaimButton';
import SheriffGrantButton from '@/components/trading/SheriffGrantButton';
import InteractiveCard from '@/components/trading/InteractiveCard';

export const revalidate = 0;

export default async function CollectionPage() {
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

  // Fetch user inventory with card details
  const { data: inventory } = await supabase
    .from('user_inventory')
    .select('*, cards(*)')
    .eq('user_id', user.id);

  const inventoryItems = (inventory as unknown as UserInventory[]) || [];
  const isSheriff = profile?.role === 'Sheriff';

  // Sort by Rarity Hierarchy
  const rarityHierarchy: Record<string, number> = {
    'Legendary': 0,
    'Epic': 1,
    'Rare': 2,
    'Uncommon': 3,
    'Common': 4
  };

  const sortedCards = [...inventoryItems].sort((a, b) => {
    return (rarityHierarchy[a.cards.rarity] ?? 5) - (rarityHierarchy[b.cards.rarity] ?? 5);
  });

  const getRarityClass = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'border-rust-700 opacity-95';
      case 'Uncommon': return 'border-green-600 shadow-[0_0_15px_rgba(22,163,74,0.3)]';
      case 'Rare': return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
      case 'Epic': return 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]';
      case 'Legendary': return 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-pulse-slow';
      default: return 'border-rust-700';
    }
  };

  const getRarityTextClass = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-sand-500';
      case 'Uncommon': return 'text-green-400';
      case 'Rare': return 'text-blue-400';
      case 'Epic': return 'text-purple-400';
      case 'Legendary': return 'text-yellow-400 font-bold';
      default: return 'text-sand-500';
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 animate-in slide-in-from-bottom duration-500 mb-20">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b-8 border-rust-900 pb-6 gap-6">
        <div className="text-center md:text-left space-y-2">
          <p className="text-terracotta-400 text-xl uppercase tracking-[0.3em] font-bold">The Great Vault</p>
          <h1 className="text-5xl font-heading uppercase tracking-tighter">Your Collection</h1>
          {isSheriff && <SheriffGrantButton />}
        </div>
        <div className="text-center md:text-right bg-rust-950/50 p-4 border-2 border-sand-500/20 panel-pixel shadow-none">
          <p className="text-lg text-sand-500 uppercase tracking-widest mb-1">Authenticated Artifacts</p>
          <p className="text-4xl text-sand-300 font-heading">{sortedCards.length}</p>
        </div>
      </div>

      {sortedCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {sortedCards.map((item) => (
            <InteractiveCard 
              key={item.id} 
              card={item.cards} 
              rarityClass={getRarityClass(item.cards.rarity)}
              rarityTextClass={getRarityTextClass(item.cards.rarity)}
            />
          ))}
        </div>
      ) : (
        <div className="panel-pixel py-32 text-center space-y-10 flex flex-col items-center bg-rust-950/20">
          <div className="space-y-4">
            <div className="text-6xl mb-6 grayscale opacity-20 animate-bounce">🃏</div>
            <p className="text-sand-500 text-3xl font-heading uppercase tracking-widest">Your satchel is empty</p>
            <p className="text-lg text-sand-500 max-w-md mx-auto font-pixel leading-relaxed">
              Every legend starts somewhere. Claim your starter pack to begin your journey in the frontier.
            </p>
          </div>
          <ClaimButton />
        </div>
      )}
    </main>
  );
}

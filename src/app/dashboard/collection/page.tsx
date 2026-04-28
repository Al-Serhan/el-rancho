import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { UserInventory } from '@/types/database';
import ClaimButton from '@/components/trading/ClaimButton';
import SheriffGrantButton from '@/components/trading/SheriffGrantButton';
import Image from 'next/image';

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

  const { data: inventory } = await supabase
    .from('user_inventory')
    .select('*, cards(*)')
    .eq('user_id', user.id);

  const myCards = (inventory as unknown as UserInventory[]) || [];
  const isSheriff = profile?.role === 'Sheriff';

  const getRarityClass = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'border-rust-700 opacity-90';
      case 'Uncommon': return 'border-green-600 shadow-[0_0_10px_rgba(22,163,74,0.3)]';
      case 'Rare': return 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
      case 'Epic': return 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
      case 'Legendary': return 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-pulse-slow';
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
    <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-end border-b-8 border-rust-900 pb-4">
        <div>
          <p className="text-terracotta-400 text-sm uppercase mb-1 tracking-widest">Vault</p>
          <h1 className="text-3xl font-heading uppercase">Your Collection</h1>
          {isSheriff && <SheriffGrantButton />}
        </div>
        <div className="text-right">
          <p className="text-xs text-sand-500 uppercase">Cards Owned</p>
          <p className="text-2xl text-sand-300 font-heading">{myCards.length}</p>
        </div>
      </div>

      {myCards.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {myCards.map((item) => (
            <div 
              key={item.id} 
              className={`panel-pixel group hover:-translate-y-2 transition-all flex flex-col h-full bg-rust-900/40 ${getRarityClass(item.cards.rarity)}`}
            >
              <div className="aspect-square bg-rust-900 mb-4 flex items-center justify-center border-4 border-rust-700 relative overflow-hidden shrink-0">
                {item.cards.image_url ? (
                  <Image 
                    src={item.cards.image_url} 
                    alt={item.cards.name} 
                    fill
                    className="pixelated p-4 object-contain group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                  />
                ) : (
                  <span className="text-4xl group-hover:scale-125 transition-transform duration-300">🃏</span>
                )}
                <div className={`absolute bottom-0 left-0 right-0 bg-rust-900/90 p-2 text-[11px] text-center uppercase border-t-2 border-rust-700 tracking-tighter ${getRarityTextClass(item.cards.rarity)}`}>
                  {item.cards.rarity}
                </div>
              </div>
              <div className="flex-1 space-y-2 px-1">
                <h3 className="text-sm text-center font-heading truncate text-sand-200 uppercase tracking-wider">{item.cards.name}</h3>
                <p className={`text-[11px] text-center uppercase tracking-widest font-bold ${getRarityTextClass(item.cards.rarity)}`}>
                  {item.cards.special_attribute}
                </p>
                <div className="h-px bg-rust-800 w-full my-1"></div>
                <p className="text-xs text-sand-300 text-center italic leading-relaxed line-clamp-4 pb-2 font-pixel">
                  &quot;{item.cards.description || 'A mysterious relic from the dusty plains.'}&quot;
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel-pixel py-20 text-center space-y-8 flex flex-col items-center">
          <div className="space-y-2">
            <p className="text-sand-500 text-xl font-heading uppercase">Your satchel is empty</p>
            <p className="text-sm text-sand-500 max-w-md mx-auto font-pixel text-lg">
              Every legend starts somewhere. Claim your starter pack to begin your journey in the frontier.
            </p>
          </div>
          <ClaimButton />
        </div>
      )}
    </main>
  );
}

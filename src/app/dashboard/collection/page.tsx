import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { UserInventory } from '@/types/database';

export const revalidate = 0;

export default async function CollectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch user inventory with card details
  const { data: inventory } = await supabase
    .from('user_inventory')
    .select('*, cards(*)')
    .eq('user_id', user.id);

  const myCards = (inventory as unknown as UserInventory[]) || [];

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-end border-b-8 border-rust-900 pb-4">
        <div>
          <p className="text-terracotta-400 text-sm uppercase mb-1">Vault</p>
          <h1 className="text-3xl">Your Collection</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-sand-500 uppercase">Cards Owned</p>
          <p className="text-2xl text-sand-300">{myCards.length}</p>
        </div>
      </div>

      {myCards.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {myCards.map((item) => (
            <div key={item.id} className="panel-pixel group hover:border-terracotta-400 transition-all hover:-translate-y-2 flex flex-col h-full">
              <div className="aspect-square bg-rust-900 mb-4 flex items-center justify-center border-4 border-rust-700 relative overflow-hidden shrink-0">
                {item.cards.image_url ? (
                  <img 
                    src={item.cards.image_url} 
                    alt={item.cards.name} 
                    className="w-full h-full pixelated p-2"
                  />
                ) : (
                  <span className="text-4xl group-hover:scale-125 transition-transform duration-300">🃏</span>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-rust-900/80 p-1 text-[10px] text-center uppercase border-t-2 border-rust-700">
                  {item.cards.rarity}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm text-center font-heading truncate text-sand-300">{item.cards.name}</h3>
                <p className="text-[10px] text-terracotta-400 text-center uppercase tracking-widest font-bold">
                  {item.cards.special_attribute}
                </p>
                <p className="text-[11px] text-sand-500 text-center italic leading-tight line-clamp-3 px-1 border-t border-rust-800 pt-2">
                  &quot;{item.cards.description || 'A mysterious relic from the dusty plains.'}&quot;
                </p>
              </div>
            </div>
          ))}
          
          {/* Empty Slots */}
          {[...Array(Math.max(0, 4 - myCards.length))].map((_, i) => (
            <div key={`empty-${i}`} className="panel-pixel opacity-20 border-dashed border-sand-500 flex items-center justify-center py-20 grayscale">
              <span className="text-2xl">?</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel-pixel py-20 text-center space-y-4">
          <p className="text-sand-500">Your satchel is empty, partner.</p>
          <p className="text-xs">Head to the Trading Post to make some deals.</p>
        </div>
      )}
    </main>
  );
}

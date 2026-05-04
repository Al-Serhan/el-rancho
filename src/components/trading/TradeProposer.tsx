'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Profile, UserInventory } from '@/types/database';
import { User } from '@supabase/supabase-js';

export default function TradeProposer({ 
  currentUser, 
  allProfiles, 
  myInventory 
}: { 
  currentUser: User, 
  allProfiles: Profile[], 
  myInventory: UserInventory[] 
}) {
  const supabase = createClient();
  const router = useRouter();
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(null);
  const [receiverInventory, setReceiverInventory] = useState<UserInventory[]>([]);
  const [offering, setOffering] = useState<string[]>([]); // inventory_ids
  const [requesting, setRequesting] = useState<string[]>([]); // inventory_ids
  const [loading, setLoading] = useState(false);

  const fetchReceiverInventory = async (userId: string) => {
    const { data } = await supabase
      .from('user_inventory')
      .select('id, user_id, card_id, acquired_at, cards(*)')
      .eq('user_id', userId);
    setReceiverInventory((data as unknown as UserInventory[]) || []);
    setRequesting([]);
  };

  const handleSelectReceiver = (userId: string) => {
    setSelectedReceiver(userId);
    fetchReceiverInventory(userId);
  };

  const toggleOffering = (id: string) => {
    setOffering(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleRequesting = (id: string) => {
    setRequesting(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const submitTrade = async () => {
    if (!selectedReceiver || (offering.length === 0 && requesting.length === 0)) return;
    setLoading(true);

    try {
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert({
          initiator_id: currentUser.id,
          receiver_id: selectedReceiver,
          status: 'pending'
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      const items = [
        ...offering.map(id => ({ trade_id: trade.id, inventory_id: id, owner_id: currentUser.id })),
        ...requesting.map(id => ({ trade_id: trade.id, inventory_id: id, owner_id: selectedReceiver }))
      ];

      const { error: itemsError } = await supabase.from('trade_items').insert(items);
      if (itemsError) throw itemsError;

      alert('Trade proposal sent, partner!');
      router.refresh();
      setOffering([]);
      setRequesting([]);
      setSelectedReceiver(null);
    } catch (err: unknown) {
      const error = err as Error;
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel-pixel">
        <h3 className="mb-4 text-lg">1. Pick a Partner</h3>
        <select 
          className="w-full bg-rust-900 border-2 border-sand-400 p-2 text-sand-400 font-pixel"
          onChange={(e) => handleSelectReceiver(e.target.value)}
          value={selectedReceiver || ''}
        >
          <option value="">Select a Cowboy...</option>
          {allProfiles.map(p => (
            <option key={p.id} value={p.id}>{p.username || 'Unknown'}</option>
          ))}
        </select>
      </div>

      {selectedReceiver && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="panel-pixel">
            <h3 className="mb-4 text-xl">Your Offering</h3>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
              {myInventory.map(item => {
                const rarityColors: Record<string, string> = {
                  Legendary: 'text-yellow-400 border-yellow-600',
                  Epic: 'text-purple-400 border-purple-600',
                  Rare: 'text-blue-400 border-blue-600',
                  Common: 'text-sand-500 border-sand-700',
                };
                const rColor = rarityColors[item.cards.rarity] ?? rarityColors['Common'];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleOffering(item.id)}
                    className={`flex items-center gap-3 p-2 border-2 cursor-pointer transition-colors ${offering.includes(item.id) ? 'border-terracotta-400 bg-rust-700' : 'border-sand-400 hover:bg-rust-800'}`}
                  >
                    {item.cards.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.cards.image_url} alt={item.cards.name} className="w-10 h-10 object-cover pixelated shrink-0 border border-sand-400" />
                    )}
                    <div className="min-w-0">
                      <p className="text-lg truncate leading-tight">{item.cards.name}</p>
                      <span className={`text-sm border px-1 ${rColor}`}>{item.cards.rarity}</span>
                    </div>
                    {offering.includes(item.id) && <span className="ml-auto text-terracotta-400 text-xl shrink-0">✓</span>}
                  </div>
                );
              })}
              {myInventory.length === 0 && <p className="text-lg text-sand-500">Your saddlebag is empty.</p>}
            </div>
          </div>

          <div className="panel-pixel">
            <h3 className="mb-4 text-xl">Their Goods</h3>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
              {receiverInventory.length === 0 && selectedReceiver && (
                <p className="text-lg text-sand-500">They&apos;ve got nothing to trade.</p>
              )}
              {receiverInventory.map(item => {
                const rarityColors: Record<string, string> = {
                  Legendary: 'text-yellow-400 border-yellow-600',
                  Epic: 'text-purple-400 border-purple-600',
                  Rare: 'text-blue-400 border-blue-600',
                  Common: 'text-sand-500 border-sand-700',
                };
                const rColor = rarityColors[item.cards.rarity] ?? rarityColors['Common'];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleRequesting(item.id)}
                    className={`flex items-center gap-3 p-2 border-2 cursor-pointer transition-colors ${requesting.includes(item.id) ? 'border-terracotta-400 bg-rust-700' : 'border-sand-400 hover:bg-rust-800'}`}
                  >
                    {item.cards.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.cards.image_url} alt={item.cards.name} className="w-10 h-10 object-cover pixelated shrink-0 border border-sand-400" />
                    )}
                    <div className="min-w-0">
                      <p className="text-lg truncate leading-tight">{item.cards.name}</p>
                      <span className={`text-sm border px-1 ${rColor}`}>{item.cards.rarity}</span>
                    </div>
                    {requesting.includes(item.id) && <span className="ml-auto text-terracotta-400 text-xl shrink-0">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedReceiver && (
        <button 
          onClick={submitTrade}
          disabled={loading || (offering.length === 0 && requesting.length === 0)}
          className="btn-pixel w-full disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Propose Trade'}
        </button>
      )}
    </div>
  );
}

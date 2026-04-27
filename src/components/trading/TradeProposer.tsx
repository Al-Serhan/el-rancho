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
            <h3 className="mb-4 text-sm">Your Offering</h3>
            <div className="grid grid-cols-1 gap-2">
              {myInventory.map(item => (
                <div 
                  key={item.id}
                  onClick={() => toggleOffering(item.id)}
                  className={`p-2 border-2 cursor-pointer transition-colors ${offering.includes(item.id) ? 'border-terracotta-400 bg-rust-700' : 'border-sand-400'}`}
                >
                  <p className="text-xs truncate">{item.cards.name}</p>
                </div>
              ))}
              {myInventory.length === 0 && <p className="text-xs text-sand-500">Inventory empty.</p>}
            </div>
          </div>

          <div className="panel-pixel">
            <h3 className="mb-4 text-sm">Their Goods</h3>
            <div className="grid grid-cols-1 gap-2">
              {receiverInventory.map(item => (
                <div 
                  key={item.id}
                  onClick={() => toggleRequesting(item.id)}
                  className={`p-2 border-2 cursor-pointer transition-colors ${requesting.includes(item.id) ? 'border-terracotta-400 bg-rust-700' : 'border-sand-400'}`}
                >
                  <p className="text-xs truncate">{item.cards.name}</p>
                </div>
              ))}
              {receiverInventory.length === 0 && <p className="text-xs text-sand-500">Inventory empty.</p>}
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

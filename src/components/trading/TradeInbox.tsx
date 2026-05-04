'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trade, TradeItem, UserInventory } from '@/types/database';

interface TradeWithDetails extends Trade {
  initiator: { username: string | null };
  trade_items: (TradeItem & { user_inventory: UserInventory })[];
}

export default function TradeInbox({ 
  incomingTrades 
}: { 
  incomingTrades: TradeWithDetails[] 
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAccept = async (tradeId: string) => {
    setLoading(tradeId);
    try {
      const { error } = await supabase.rpc('accept_trade', { p_trade_id: tradeId });
      if (error) throw error;
      alert('Trade successful! Check your inventory.');
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      alert('Error: ' + error.message);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (tradeId: string) => {
    setLoading(tradeId);
    try {
      const { error } = await supabase
        .from('trades')
        .update({ status: 'rejected' })
        .eq('id', tradeId);
      if (error) throw error;
      alert('Trade rejected.');
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      alert('Error: ' + error.message);
    } finally {
      setLoading(null);
    }
  };

  if (incomingTrades.length === 0) {
    return (
      <div className="panel-pixel text-center py-12">
        <p className="text-sand-500">No incoming trades at the moment, cowboy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incomingTrades.map(trade => {
        const offering = trade.trade_items.filter(i => i.owner_id === trade.initiator_id);
        const requesting = trade.trade_items.filter(i => i.owner_id === trade.receiver_id);

        return (
          <div key={trade.id} className="panel-pixel space-y-4">
            <div className="flex justify-between items-center border-b-2 border-rust-900 pb-2">
              <Link
                href={`/dashboard/profile/${trade.initiator_id}`}
                className="text-xl hover:text-terracotta-400 transition-colors underline underline-offset-2 decoration-sand-600 hover:decoration-terracotta-400"
              >
                From: {trade.initiator.username || 'Anonymous'}
              </Link>
              <span className="text-lg text-terracotta-400">{new Date(trade.created_at).toLocaleDateString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg uppercase mb-1 text-sand-500 font-heading">They Offer:</p>
                <ul className="text-xl list-disc list-inside">
                  {offering.map(item => (
                    <li key={item.id} className="truncate">{item.user_inventory?.cards.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-lg uppercase mb-1 text-sand-500 font-heading">They Want:</p>
                <ul className="text-xl list-disc list-inside">
                  {requesting.map(item => (
                    <li key={item.id} className="truncate">{item.user_inventory?.cards.name}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => handleAccept(trade.id)}
                disabled={!!loading}
                className="btn-pixel bg-green-600 border-green-800 text-white flex-1"
              >
                {loading === trade.id ? '...' : 'Accept'}
              </button>
              <button 
                onClick={() => handleReject(trade.id)}
                disabled={!!loading}
                className="btn-pixel bg-red-600 border-red-800 text-white flex-1"
              >
                {loading === trade.id ? '...' : 'Reject'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

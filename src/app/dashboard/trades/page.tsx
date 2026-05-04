import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import TradeProposer from '@/components/trading/TradeProposer';
import TradeInbox from '@/components/trading/TradeInbox';
import Link from 'next/link';
import { Profile, UserInventory, Trade, TradeItem } from '@/types/database';

interface TradeWithDetails extends Trade {
  initiator: { username: string | null };
  receiver?: { username: string | null };
  trade_items: (TradeItem & { user_inventory: UserInventory })[];
}

export const revalidate = 0;

export default async function TradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch all profiles except current user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id);

  // Fetch current user inventory
  const { data: inventory } = await supabase
    .from('user_inventory')
    .select('id, user_id, card_id, acquired_at, cards(*)')
    .eq('user_id', user.id);

  // Fetch incoming trades (where user is receiver)
  const { data: incomingTrades } = await supabase
    .from('trades')
    .select(`
      *,
      initiator:profiles!initiator_id(username),
      trade_items(
        *,
        user_inventory(
          *,
          cards(*)
        )
      )
    `)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Fetch outgoing trades (where user is initiator)
  const { data: outgoingTrades } = await supabase
    .from('trades')
    .select(`
      *,
      receiver:profiles!receiver_id(username),
      trade_items(
        *,
        user_inventory(
          *,
          cards(*)
        )
      )
    `)
    .eq('initiator_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-500 relative min-h-screen">
      <div className="fixed inset-0 z-[-1]">
        <Image 
          src="/backgrounds/trades.png" 
          alt="Trades Background" 
          fill 
          className="object-cover opacity-30 pixelated"
          unoptimized 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80"></div>
      </div>
      <div className="flex justify-between items-center border-b-8 border-rust-900 pb-4">
        <h1 className="text-4xl font-heading uppercase tracking-tighter text-terracotta-400">The Trading Post</h1>
        <Link href="/dashboard" className="btn-pixel py-3 text-sm">Back to Office</Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Left Column: Propose */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📜</span>
            <h2 className="text-2xl font-heading uppercase tracking-widest">Propose a New Swap</h2>
          </div>
          <TradeProposer 
            currentUser={user} 
            allProfiles={(profiles as Profile[]) || []} 
            myInventory={(inventory as unknown as UserInventory[]) || []} 
          />
        </div>

        {/* Right Column: Inboxes */}
        <div className="lg:col-span-5 space-y-12">
          
          {/* Incoming */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b-4 border-rust-900 pb-2">
              <span className="text-3xl">📥</span>
              <h2 className="text-2xl font-heading uppercase tracking-widest">Incoming Offers</h2>
            </div>
            <TradeInbox incomingTrades={(incomingTrades as unknown as TradeWithDetails[]) || []} />
          </div>

          {/* Outgoing */}
          <div className="space-y-6 opacity-80">
            <div className="flex items-center gap-3 border-b-4 border-rust-900 pb-2">
              <span className="text-3xl">📤</span>
              <h2 className="text-2xl font-heading uppercase tracking-widest">Pending Outgoing</h2>
            </div>
            {(outgoingTrades?.length || 0) > 0 ? (
              <div className="space-y-4">
                {outgoingTrades?.map((trade) => (
                  <div key={trade.id} className="panel-pixel py-4 px-6 border-sand-500/30">
                    <div className="flex justify-between text-sm uppercase mb-2">
                      <span className="text-sand-400">To: {trade.receiver?.username}</span>
                      <span className="text-terracotta-400 font-bold">WAITING...</span>
                    </div>
                    <p className="text-xs text-sand-600 italic">Sent on {new Date(trade.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-pixel py-8 text-center text-sand-600 text-sm italic">
                No active outgoing offers.
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

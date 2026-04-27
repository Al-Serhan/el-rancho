import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import TradeProposer from '@/components/trading/TradeProposer';
import TradeInbox from '@/components/trading/TradeInbox';
import Link from 'next/link';
import { Profile, UserInventory, Trade, TradeItem } from '@/types/database';

interface TradeWithDetails extends Trade {
  initiator: { username: string | null };
  trade_items: (TradeItem & { user_inventory: UserInventory })[];
}

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

  // Fetch incoming trades
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

  return (
    <main className="min-h-screen p-4 md:p-8 bg-rust-900 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl">Trading Post</h1>
        <Link href="/dashboard" className="btn-pixel py-2 text-xs">Back to Office</Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-lg">Propose a Swap</h2>
          <TradeProposer 
            currentUser={user} 
            allProfiles={(profiles as Profile[]) || []} 
            myInventory={(inventory as unknown as UserInventory[]) || []} 
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg">Incoming Offers</h2>
          <TradeInbox incomingTrades={(incomingTrades as unknown as TradeWithDetails[]) || []} />
        </div>
      </div>
    </main>
  );
}

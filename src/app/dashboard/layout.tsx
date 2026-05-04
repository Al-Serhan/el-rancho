import Navbar from '@/components/trading/Navbar';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { GoldProvider } from '@/context/GoldContext';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('gold_coins')
    .eq('id', user.id)
    .single();

  const initialGold = profile?.gold_coins ?? 100;

  return (
    <GoldProvider initialGold={initialGold}>
      <div className="min-h-screen bg-rust-900 flex flex-col relative">
        {/* Decorative Desert Floor */}
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-rust-950 to-transparent pointer-events-none z-0"></div>
        
        <Navbar />
        <div className="flex-1 w-full z-10">
          {children}
        </div>
      </div>
    </GoldProvider>
  );
}

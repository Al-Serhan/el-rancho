'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function resolvePokerGame(bet: number, multiplier: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const adminSupabase = createAdminClient();
  
  // 1. Get current gold
  const { data: profile, error: fetchError } = await adminSupabase
    .from('profiles')
    .select('gold_coins')
    .eq('id', user.id)
    .single();

  if (fetchError || !profile) {
    throw new Error('Could not fetch profile');
  }

  // 2. Validate bet
  if (profile.gold_coins < bet) {
    throw new Error('Insufficient gold coins');
  }

  // 3. Calculate new balance
  // If multiplier is 0, they lose the bet.
  // If multiplier is > 0, they get (bet * multiplier). 
  // For Jacks or Better: Jacks = 1x (money back), Two Pair = 2x, etc.
  const winnings = Math.floor(bet * multiplier);
  const netChange = winnings - bet;
  const newBalance = profile.gold_coins + netChange;

  // 4. Update database
  const { error: updateError } = await adminSupabase
    .from('profiles')
    .update({ gold_coins: newBalance })
    .eq('id', user.id);

  if (updateError) {
    throw new Error('Failed to update gold coins');
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/leaderboard');
  
  return { newBalance, netChange };
}

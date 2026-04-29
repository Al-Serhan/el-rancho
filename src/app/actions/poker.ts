'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function resolvePokerGame(invested: number, winnings: number) {
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

  // 2. Calculate net change
  const netChange = winnings - invested;
  const newBalance = profile.gold_coins + netChange;

  if (newBalance < 0) {
    throw new Error('Insufficient gold coins for this action');
  }

  // 3. Update database
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

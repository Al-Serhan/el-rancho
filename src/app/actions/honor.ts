'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function incrementHonor(amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('honor')
    .eq('id', user.id)
    .single();

  const currentHonor = profile?.honor || 0;
  const newHonor = currentHonor + amount;

  await supabase
    .from('profiles')
    .update({ honor: newHonor })
    .eq('id', user.id);

  revalidatePath('/dashboard');
  
  return newHonor;
}

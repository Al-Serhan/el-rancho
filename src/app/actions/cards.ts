'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

const FRONTIER_LEGENDS = [
  { name: 'Tumbleweed', rarity: 'Common', special_attribute: 'Agility +1', description: 'Blows where the wind takes it. Good for a quick getaway.', image_url: '/cards/tumbleweed.svg' },
  { name: 'Rusty Revolver', rarity: 'Common', special_attribute: 'Attack +2', description: 'It jams on occasion, but it is better than throwing rocks.', image_url: '/cards/rusty-revolver.svg' },
  { name: 'Cactus Juice', rarity: 'Uncommon', special_attribute: 'Heals 15 HP', description: 'Tastes terrible, but stops the bleeding.', image_url: '/cards/cactus-juice.svg' },
  { name: 'Bandit Mask', rarity: 'Uncommon', special_attribute: 'Stealth +3', description: 'Hides your identity from the law and the flies.', image_url: '/cards/bandit-mask.svg' },
  { name: 'Sheriff Star', rarity: 'Rare', special_attribute: 'Authority +5', description: 'Commands respect across the county lines.', image_url: '/cards/sheriff-star.svg' },
  { name: 'Stolen Gold Ingot', rarity: 'Rare', special_attribute: 'Value +100', description: 'Heavy, shiny, and highly illegal.', image_url: '/cards/gold-ingot.svg' },
  { name: 'Ghost Town Map', rarity: 'Epic', special_attribute: 'Unlocks Secrets', description: 'X marks a spot that hasn’t existed for fifty years.', image_url: '/cards/ghost-town-map.svg' },
  { name: 'Calamity Jane Rifle', rarity: 'Legendary', special_attribute: 'Attack +20, Piercing', description: 'Legend says she never missed a shot. Now it’s yours.', image_url: '/cards/calamity-jane-rifle.svg' },
  { name: 'The Saloon Clanker', rarity: 'Legendary', special_attribute: 'Automation +50', description: 'An AI bot from Sheriff Jones’ Server. It calculates probabilities faster than you can draw.', image_url: '/cards/saloon-clanker.svg' },
];

export async function claimStarterPack() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminSupabase = createAdminClient();

  // 1. Ensure all cards exist
  const { data: cards, error: cardsError } = await adminSupabase
    .from('cards')
    .upsert(FRONTIER_LEGENDS, { onConflict: 'name' })
    .select();

  if (cardsError) throw new Error('Initialization failed');

  // 2. Check for existing cards
  const { count } = await adminSupabase
    .from('user_inventory')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (count && count > 0) throw new Error('Pack already claimed, partner.');

  // 3. LOGIC: Pick 3 Random Cards
  // We'll give 2 Commons and 1 Uncommon/Rare
  const commons = cards.filter(c => c.rarity === 'Common');
  const others = cards.filter(c => c.rarity !== 'Common' && c.rarity !== 'Legendary');
  
  const selected: any[] = [];
  // 2 Random Commons
  for(let i=0; i<2; i++) {
    selected.push(commons[Math.floor(Math.random() * commons.length)]);
  }
  // 1 Random Uncommon/Rare/Epic
  selected.push(others[Math.floor(Math.random() * others.length)]);

  const inventoryItems = selected.map(card => ({
    user_id: user.id,
    card_id: card.id
  }));

  await adminSupabase.from('user_inventory').insert(inventoryItems);
  
  revalidatePath('/dashboard/collection');
  return { success: true };
}

export async function sheriffGrantAllCards() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify Role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'Sheriff') throw new Error('Only the Sheriff can do this!');

  const adminSupabase = createAdminClient();
  const { data: cards } = await adminSupabase.from('cards').select('id');
  
  if (!cards) return;

  const inventoryItems = cards.map(card => ({
    user_id: user.id,
    card_id: card.id
  }));

  // Clear existing and grant all
  await adminSupabase.from('user_inventory').delete().eq('user_id', user.id);
  await adminSupabase.from('user_inventory').insert(inventoryItems);

  revalidatePath('/dashboard/collection');
}

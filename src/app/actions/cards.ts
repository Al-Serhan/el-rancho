'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

const FRONTIER_LEGENDS = [
  { name: 'Tumbleweed', rarity: 'Common', special_attribute: 'Agility +1', description: 'Blows where the wind takes it. Good for a quick getaway.', image_url: '/cards/tumbleweed.svg' },
  { name: 'Rusty Revolver', rarity: 'Common', special_attribute: 'Attack +2', description: 'It jams on occasion, but it is better than throwing rocks.', image_url: '/cards/rusty-revolver.svg' },
  { name: 'Old Boot', rarity: 'Common', special_attribute: 'Stamina +1', description: 'Found in a dry creek bed. Smells like 1849.', image_url: '/cards/old-boot.svg' },
  { name: 'Iron Spur', rarity: 'Common', special_attribute: 'Speed +2', description: 'Makes a satisfying jingle with every step.', image_url: '/cards/iron-spur.svg' },
  { name: 'Cactus Juice', rarity: 'Uncommon', special_attribute: 'Heals 15 HP', description: 'Tastes terrible, but stops the bleeding.', image_url: '/cards/cactus-juice.svg' },
  { name: 'Bandit Mask', rarity: 'Uncommon', special_attribute: 'Stealth +3', description: 'Hides your identity from the law and the flies.', image_url: '/cards/bandit-mask.svg' },
  { name: 'Snake Skin', rarity: 'Uncommon', special_attribute: 'Poison Resist', description: 'Shed by a rattler near the O.K. Corral.', image_url: '/cards/snake-skin.svg' },
  { name: 'Lucky Coin', rarity: 'Uncommon', special_attribute: 'Luck +5', description: 'Heads you win, tails you live to fight another day.', image_url: '/cards/lucky-coin.svg' },
  { name: 'Sheriff Star', rarity: 'Rare', special_attribute: 'Authority +5', description: 'Commands respect across the county lines.', image_url: '/cards/sheriff_star.png' },
  { name: 'Stolen Gold Ingot', rarity: 'Rare', special_attribute: 'Value +100', description: 'Heavy, shiny, and highly illegal.', image_url: '/cards/gold_ingot.png' },
  { name: 'Wanted Poster', rarity: 'Rare', special_attribute: 'Bounty +50', description: 'Dead or Alive. Mostly Dead.', image_url: '/cards/wanted_poster.png' },
  { name: 'Silver Bullet', rarity: 'Rare', special_attribute: 'Werewolf Bane', description: 'Expensive to fire, but essential for the full moon.', image_url: '/cards/silver_bullet.png' },
  { name: 'Ghost Town Map', rarity: 'Epic', special_attribute: 'Unlocks Secrets', description: 'X marks a spot that hasn’t existed for fifty years.', image_url: '/cards/ghost_town_map.png' },
  { name: 'Desert Rose', rarity: 'Epic', special_attribute: 'Charisma +10', description: 'A rare bloom that survives the harshest winters.', image_url: '/cards/desert_rose.png' },
  { name: 'Ace of Spades', rarity: 'Epic', special_attribute: 'Instant Win', description: 'The death card. Use it wisely.', image_url: '/cards/ace_of_spades.png' },
  { name: 'Buffalo Skull', rarity: 'Epic', special_attribute: 'Intimidation +8', description: 'A bleached reminder of the old ways.', image_url: '/cards/buffalo_skull.png' },
  { name: 'Dynamite', rarity: 'Epic', special_attribute: 'Blast Damage 50', description: 'Handle with care. Or don’t. We aren’t your parents.', image_url: '/cards/dynamite.png' },
  { name: 'Calamity Jane Rifle', rarity: 'Legendary', special_attribute: 'Attack +20', description: 'Legend says she never missed a shot. Now it’s yours.', image_url: '/cards/calamity_jane_rifle.png' },
  { name: 'The Saloon Clanker', rarity: 'Legendary', special_attribute: 'Automation +50', description: 'An AI bot from Sheriff Jones’ Server. It calculates probabilities faster than you can draw.', image_url: '/cards/the_saloon_clanker.png' },
  { name: 'Golden Key', rarity: 'Legendary', special_attribute: 'Unlocks All', description: 'Rumored to open the forbidden vault beneath the old bank.', image_url: '/cards/golden_key.png' },
  { name: 'Tomahawk', rarity: 'Epic', special_attribute: 'Precision +15', description: 'Balanced for throwing, carved with ancient protective runes.', image_url: '/cards/tomahawk.png' },
  { name: 'Peace Pipe', rarity: 'Epic', special_attribute: 'Diplomacy +20', description: 'Settles disputes without a single drop of blood being spilled.', image_url: '/cards/peace_pipe.png' },
  { name: 'Bear Claw', rarity: 'Epic', special_attribute: 'Strength +12', description: 'Trophy from a beast that once ruled the high Sierras.', image_url: '/cards/bear_claw.png' },
  { name: 'Desert Falcon', rarity: 'Epic', special_attribute: 'Scouting +10', description: 'Sees every movement from miles above the canyon floor.', image_url: '/cards/desert_falcon.png' },
  { name: 'Tanned Hide', rarity: 'Uncommon', special_attribute: 'Defense +5', description: 'Tough leather, cured in the sun for seven days.', image_url: '/cards/tanned-hide.svg' },
  { name: 'Mining Pick', rarity: 'Uncommon', special_attribute: 'Mining +8', description: 'Used to strike gold in the Black Hills. Still sharp.', image_url: '/cards/mining-pick.svg' },
  { name: 'Kerosene Lamp', rarity: 'Uncommon', special_attribute: 'Visibility +10', description: 'Pierces through the darkest desert nights.', image_url: '/cards/kerosene-lamp.svg' },
  { name: 'Stagecoach Wheel', rarity: 'Common', special_attribute: 'Repair +5', description: 'A sturdy spare for the long road to San Francisco.', image_url: '/cards/stagecoach-wheel.svg' },
  { name: 'Cowboy Hat', rarity: 'Common', special_attribute: 'Style +2', description: 'A wide-brimmed classic. Keeps the sun out of your eyes.', image_url: '/cards/cowboy-hat.svg' },
  { name: 'One-Eyed Mossy', rarity: 'Rare', special_attribute: '+5 Intimidation', description: 'A seasoned player of the Saloon. Missing an eye, but never misses a bluff.', image_url: '/avatars/pete.png' },
  { name: 'Feller Epilex', rarity: 'Rare', special_attribute: '+3 Luck', description: 'He sweats bullets when the stakes get high. Mostly plays to feed his mule.', image_url: '/avatars/rusty.png' },
  { name: 'AI Silas', rarity: 'Rare', special_attribute: '100% Logic', description: 'A mechanical marvel built to calculate the odds perfectly. Rarely folds.', image_url: '/avatars/silas.png' },
  { name: 'Common squid', rarity: 'Common', special_attribute: 'Server Veteran', description: 'Despite the name, this cosmic space fish is an original member of the Discord server. Floats through the cosmos with quiet authority.', image_url: '/cards/common_squid.png' }
];

export async function claimStarterPack() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminSupabase = createAdminClient();

  // 1. Ensure all cards exist
  await adminSupabase.from('cards').upsert(FRONTIER_LEGENDS, { onConflict: 'name' });
  const { data: cards, error: cardsError } = await adminSupabase
    .from('cards')
    .select();

  if (cardsError || !cards) throw new Error('Initialization failed');

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
  
  interface SelectedCard {
    id: string;
    name: string;
    rarity: string;
  }
  const selected: SelectedCard[] = [];
  // 2 Random Commons
  for(let i=0; i<2; i++) {
    selected.push(commons[Math.floor(Math.random() * commons.length)] as SelectedCard);
  }
  // 1 Random Uncommon/Rare/Epic
  selected.push(others[Math.floor(Math.random() * others.length)] as SelectedCard);

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

  // 1. Force Sync the entire library first
  await adminSupabase.from('cards').upsert(FRONTIER_LEGENDS, { onConflict: 'name' });

  const { data: allCards, error: selectError } = await adminSupabase
    .from('cards')
    .select('id');

  if (selectError || !allCards) throw new Error('Failed to fetch library');

  const inventoryItems = allCards.map(card => ({
    user_id: user.id,
    card_id: card.id
  }));

  // 2. Clear existing and grant the complete 29-card set
  await adminSupabase.from('user_inventory').delete().eq('user_id', user.id);
  await adminSupabase.from('user_inventory').insert(inventoryItems);

  revalidatePath('/dashboard/collection');
}

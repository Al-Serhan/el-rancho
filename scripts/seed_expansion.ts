import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NEW_CARDS = [
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

async function seed() {
  console.log('🌵 Seeding Frontier Legends Set...');

  // 1. Upsert Cards
  const insertedCards: any[] = [];
  for (const card of NEW_CARDS) {
    const { data, error } = await supabase
      .from('cards')
      .upsert(card, { onConflict: 'name' })
      .select()
      .single();
    
    if (error) {
      console.error(`Error inserting ${card.name}:`, error.message);
    } else {
      insertedCards.push(data);
      console.log(`✅ Upserted card: ${card.name}`);
    }
  }

  // 2. Try to find user thesheriff6969
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', 'thesheriff6969')
    .maybeSingle();

  if (profile) {
    console.log(`👤 Found user thesheriff6969 (ID: ${profile.id}). Assigning cards...`);
    const inventoryItems = insertedCards.map(card => ({
      user_id: profile.id,
      card_id: card.id
    }));

    const { error: invError } = await supabase.from('user_inventory').insert(inventoryItems);
    if (invError) {
      console.error('Error assigning cards:', invError.message);
    } else {
      console.log('✨ All cards assigned to thesheriff6969 successfully!');
    }
  } else {
    console.log('⚠️ User "thesheriff6969" not found in this database. Cards were created but not assigned.');
  }

  console.log('🌵 Seeding complete!');
}

seed();

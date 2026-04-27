import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log('🌵 Starting the Great El Rancho Seed...');

  // 1. Clear existing data (optional, but good for clean tests)
  // Note: user_inventory and profiles will cascade from users
  await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // 2. Insert Cards
  const { data: cards, error: cardsError } = await supabase.from('cards').insert([
    { name: 'Rusty Spur', rarity: 'Common', special_attribute: 'Speed +1' },
    { name: 'Broken Horseshoe', rarity: 'Common', special_attribute: 'Luck +1' },
    { name: 'Desert Rose', rarity: 'Uncommon', special_attribute: 'Charisma +2' },
    { name: 'Silver Bullet', rarity: 'Rare', special_attribute: 'Attack +5' },
    { name: 'Golden Lasso', rarity: 'Legendary', special_attribute: 'Capture Rate 100%' },
    { name: 'Snake Oil', rarity: 'Uncommon', special_attribute: 'Heals 20 HP' },
  ]).select();

  if (cardsError) {
    console.error('Error inserting cards:', cardsError);
    return;
  }
  console.log(`✅ Created ${cards.length} cards.`);

  // 3. Create Test Users
  const testUsers = [
    { email: 'dan@elrancho.com', password: 'password123', name: 'Cowboy Dan' },
    { email: 'jesse@elrancho.com', password: 'password123', name: 'Outlaw Jesse' },
  ];

  const userIds: string[] = [];

  for (const u of testUsers) {
    // Check if user exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const user = existing.users.find(eu => eu.email === u.email);

    if (user) {
      userIds.push(user.id);
      console.log(`🤠 User ${u.name} already exists.`);
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name, role: u.name === 'Cowboy Dan' ? 'Sheriff' : 'Outlaw' }
      });
      if (createError) {
        console.error(`Error creating ${u.name}:`, createError);
      } else {
        userIds.push(newUser.user.id);
        console.log(`✨ Created user: ${u.name}`);
      }
    }
  }

  // 4. Assign Inventory
  if (userIds.length >= 2 && cards.length >= 4) {
    // Dan gets first 2 cards
    await supabase.from('user_inventory').insert([
      { user_id: userIds[0], card_id: cards[0].id },
      { user_id: userIds[0], card_id: cards[1].id },
    ]);

    // Jesse gets next 2 cards
    await supabase.from('user_inventory').insert([
      { user_id: userIds[1], card_id: cards[2].id },
      { user_id: userIds[1], card_id: cards[3].id },
    ]);

    console.log('🎒 Assigned initial inventories to Dan and Jesse.');
  }

  console.log('🌵 Seeding complete! Happy trails.');
}

seed().catch(console.error);

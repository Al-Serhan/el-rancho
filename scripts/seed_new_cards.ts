import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const cards = [
    {
      name: 'One-Eyed Pete',
      rarity: 'Rare',
      image_url: '/avatars/pete.png',
      special_attribute: '+5 Intimidation',
      description: 'A seasoned player of the Saloon. Missing an eye, but never misses a bluff.'
    },
    {
      name: 'Rusty Red',
      rarity: 'Rare',
      image_url: '/avatars/rusty.png',
      special_attribute: '+3 Luck',
      description: 'He sweats bullets when the stakes get high. Mostly plays to feed his mule.'
    },
    {
      name: 'AI Silas',
      rarity: 'Rare',
      image_url: '/avatars/silas.png',
      special_attribute: '100% Logic',
      description: 'A mechanical marvel built to calculate the odds perfectly. Rarely folds.'
    },
    {
      name: 'Calamity Jane Rifle',
      rarity: 'Legendary',
      image_url: '/cards/calamity_jane_rifle.png',
      special_attribute: 'Sure-Shot',
      description: 'An ornate wood and polished silver rifle. It never misses its mark.'
    },
    {
      name: 'The Saloon Clanker',
      rarity: 'Legendary',
      image_url: '/cards/the_saloon_clanker.png',
      special_attribute: 'Iron Grip',
      description: 'A heavy mechanical arm retrofitted with brass gears. Perfect for saloon brawls.'
    },
    {
      name: 'Golden Key',
      rarity: 'Legendary',
      image_url: '/cards/golden_key.png',
      special_attribute: 'Opens All Doors',
      description: 'A glowing, magical skeleton key that opens anything in the frontier.'
    }
  ];

  for (const card of cards) {
    const { error } = await supabase.from('cards').insert(card);
    if (error && error.code !== '23505') { // Ignore unique constraint errors
      console.error(`Error inserting ${card.name}:`, error);
    } else {
      console.log(`Inserted ${card.name}`);
    }
  }
}

seed().catch(console.error);

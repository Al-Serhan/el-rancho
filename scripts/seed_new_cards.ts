import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const cards = [
    {
      name: 'Common Squid',
      rarity: 'Common',
      image_url: '/cards/common_squid.png',
      special_attribute: 'Server Veteran',
      description: 'Despite the name, this cosmic space fish is an original member of the Discord server.'
    },
    {
      name: 'Tomahawk',
      rarity: 'Common',
      image_url: '/cards/tomahawk.png',
      special_attribute: 'Frontier Tool',
      description: 'A sharp, reliable tool for any aspiring farmer or deputy.'
    },
    {
      name: 'Peace Pipe',
      rarity: 'Uncommon',
      image_url: '/cards/peace_pipe.png',
      special_attribute: 'Diplomatic',
      description: 'Used to settle disputes in the dusty saloons of El Rancho.'
    },
    {
      name: 'Bear Claw',
      rarity: 'Rare',
      image_url: '/cards/bear_claw.png',
      special_attribute: 'Trophy',
      description: 'A mark of courage, taken from the grizzly peaks of the north.'
    },
    {
      name: 'Desert Falcon',
      rarity: 'Epic',
      image_url: '/cards/desert_falcon.png',
      special_attribute: 'Aerial Sight',
      description: 'Swift as the desert wind, sharp as a cactus needle.'
    },
    {
      name: 'Sheriff Star',
      rarity: 'Legendary',
      image_url: '/cards/sheriff_star.png',
      special_attribute: 'Law & Order',
      description: 'The ultimate symbol of authority in these lawless lands.'
    },
    {
      name: 'Stolen Gold Ingot',
      rarity: 'Rare',
      image_url: '/cards/gold_ingot.png',
      special_attribute: 'Value +100',
      description: 'Heavy, shiny, and highly illegal.'
    },
    {
      name: 'Wanted Poster',
      rarity: 'Rare',
      image_url: '/cards/wanted_poster.png',
      special_attribute: 'Bounty +50',
      description: 'Dead or Alive. Mostly Dead.'
    },
    {
      name: 'Silver Bullet',
      rarity: 'Rare',
      image_url: '/cards/silver_bullet.png',
      special_attribute: 'Werewolf Bane',
      description: 'Expensive to fire, but essential for the full moon.'
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

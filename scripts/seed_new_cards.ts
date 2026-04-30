import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const cards = [
    {
      name: 'Common squid',
      rarity: 'Common',
      image_url: '/cards/common_squid.png',
      special_attribute: 'Server Veteran',
      description: 'Despite the name, this cosmic space fish is an original member of the Discord server. Floats through the cosmos with quiet authority.'
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

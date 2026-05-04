import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGE_URL_FIXES: Record<string, string> = {
  'Tomahawk':          '/cards/tomahawk.png',
  'Peace Pipe':        '/cards/peace_pipe.png',
  'Bear Claw':         '/cards/bear_claw.png',
  'Desert Falcon':     '/cards/desert_falcon.png',
  'Sheriff Star':      '/cards/sheriff_star.png',
  'Stolen Gold Ingot': '/cards/gold_ingot.png',
  'Wanted Poster':     '/cards/wanted_poster.png',
  'Silver Bullet':     '/cards/silver_bullet.png',
};

async function fix() {
  for (const [name, image_url] of Object.entries(IMAGE_URL_FIXES)) {
    const { error } = await supabase
      .from('cards')
      .update({ image_url })
      .eq('name', name);

    if (error) {
      console.error(`❌ Failed to update "${name}":`, error.message);
    } else {
      console.log(`✅ Updated "${name}" → ${image_url}`);
    }
  }
}

fix().catch(console.error);

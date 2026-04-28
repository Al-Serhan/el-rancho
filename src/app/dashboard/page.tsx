import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch real profile data from the database
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'Farmer';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || '/default-avatar.png';
  const username = profile?.username || user.user_metadata?.full_name || 'Anonymous Cowboy';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-rust-900">
      <div className="panel-pixel max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl text-terracotta-400">Sheriff&apos;s Office</h1>
        
        <div className="flex flex-col items-center space-y-4">
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="w-32 h-32 border-4 border-sand-400 pixelated" 
          />
          <div>
            <h2 className="text-2xl">{username}</h2>
            <p className="text-sand-500 mt-2 text-lg">Role: <span className="text-terracotta-400">{role}</span></p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard/trades" className="btn-pixel w-full text-center">
            Trading Post
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="btn-pixel w-full">
              Log Out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

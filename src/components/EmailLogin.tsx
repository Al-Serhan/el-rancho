'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function EmailLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const dummyEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@elrancho.local`;

    let authError = null;

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: dummyEmail,
        password,
        options: {
          data: {
            full_name: username
          }
        }
      });
      authError = error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password,
      });
      authError = error;
    }

    if (authError) {
      alert(authError.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 border-t-2 border-rust-800 pt-6 mt-6">
      <p className="text-sm text-sand-500 uppercase font-heading">Drifter Login (No Email Required)</p>
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Username (e.g. DanTheMan)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-rust-800 border-2 border-sand-400 p-2 text-sand-400 text-sm focus:outline-none focus:border-terracotta-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-rust-800 border-2 border-sand-400 p-2 text-sand-400 text-sm focus:outline-none focus:border-terracotta-400"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="btn-pixel w-full bg-sand-400 border-sand-600"
        >
          {loading ? 'Entering...' : isSignUp ? 'Create Account' : 'Enter the Rancho'}
        </button>
      </form>
      <div className="text-center pt-2">
        <button 
          onClick={() => setIsSignUp(!isSignUp)} 
          className="text-sand-500 hover:text-terracotta-400 underline text-sm uppercase tracking-widest font-bold"
        >
          {isSignUp ? 'Already a drifter? Login' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
}

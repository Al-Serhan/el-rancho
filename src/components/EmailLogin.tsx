'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function EmailLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 border-t-2 border-rust-800 pt-6 mt-6">
      <p className="text-sm text-sand-500 uppercase font-heading">Dev Login (Local Only)</p>
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email (e.g. dan@elrancho.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          {loading ? 'Entering...' : 'Enter the Rancho'}
        </button>
      </form>
    </div>
  );
}

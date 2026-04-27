'use client';

import { createClient } from '@/utils/supabase/client';

export default function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <button onClick={handleLogin} className="btn-pixel">
      Login with Discord
    </button>
  );
}

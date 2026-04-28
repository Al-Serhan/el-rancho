'use client';

import { sheriffGrantAllCards } from '@/app/actions/cards';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SheriffGrantButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGrant = async () => {
    setLoading(true);
    try {
      await sheriffGrantAllCards();
      alert('Authority invoked. All cards added to your vault, Sheriff.');
      router.refresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGrant} 
      disabled={loading}
      className="btn-pixel bg-rust-900 text-terracotta-400 border-terracotta-400 px-4 py-2 text-[10px] mt-4"
    >
      {loading ? 'INVOKING...' : '⚙️ ADMIN: GRANT ALL CARDS'}
    </button>
  );
}

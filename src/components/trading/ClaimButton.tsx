'use client';

import { claimStarterPack } from '@/app/actions/cards';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClaimButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClaim = async () => {
    setLoading(true);
    try {
      await claimStarterPack();
      alert('The frontier has provided! Check your satchel.');
      router.refresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClaim} 
      disabled={loading}
      className="btn-pixel bg-terracotta-400 text-rust-900 border-terracotta-600 px-8 py-4 text-xl"
    >
      {loading ? 'OPENING PACK...' : 'CLAIM FRONTIER PACK'}
    </button>
  );
}

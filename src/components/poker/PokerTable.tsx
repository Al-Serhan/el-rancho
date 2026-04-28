'use client';

import { useState, useEffect } from 'react';
import { resolvePokerGame } from '@/app/actions/poker';
import Image from 'next/image';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  suit: Suit;
  rank: Rank;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

interface NPC {
  name: string;
  avatar: string;
  phrase: string;
  personality: 'aggressive' | 'cowardly' | 'sassy';
  lastAction?: string;
}

const NPCS: NPC[] = [
  { name: 'One-Eyed Pete', avatar: '👁️', phrase: 'I seen better hands in a graveyard!', personality: 'aggressive' },
  { name: 'Rusty Red', avatar: '🧔', phrase: 'Is it my turn yet? I got beans cookin.', personality: 'cowardly' },
  { name: 'AI Silas', avatar: '🤖', phrase: 'Calculating... your probability of winning is 0.04%.', personality: 'sassy' }
];

export default function PokerTable({ initialGold }: { initialGold: number }) {
  const [gold, setGold] = useState(initialGold);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setHand] = useState<Card[]>([]);
  const [communityCards, setCommunity] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'betting' | 'flop' | 'turn' | 'river' | 'showdown' | 'result'>('betting');
  const [pot, setPot] = useState(0);
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState('Welcome to the Saloon, stranger.');
  const [loading, setLoading] = useState(false);
  const [npcChat, setNpcChat] = useState<string>('');

  const createDeck = () => {
    const newDeck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        newDeck.push({ suit, rank });
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const startRound = () => {
    if (gold < bet) return alert('Out of gold, cowboy!');
    const newDeck = createDeck();
    const hand = newDeck.splice(0, 2);
    setDeck(newDeck);
    setHand(hand);
    setCommunity([]);
    setPot(bet * 4); // Player + 3 NPCs
    setGold(prev => prev - bet);
    setPhase('flop');
    setMessage('Here are your cards. Watch them close.');
    triggerNpcChat('start');
  };

  const nextPhase = async () => {
    const newDeck = [...deck];
    if (phase === 'flop') {
      setCommunity(newDeck.splice(0, 3));
      setDeck(newDeck);
      setPhase('turn');
      triggerNpcChat('flop');
    } else if (phase === 'turn') {
      setCommunity(prev => [...prev, newDeck.splice(0, 1)[0]]);
      setDeck(newDeck);
      setPhase('river');
      triggerNpcChat('turn');
    } else if (phase === 'river') {
      setCommunity(prev => [...prev, newDeck.splice(0, 1)[0]]);
      setDeck(newDeck);
      setPhase('showdown');
      triggerNpcChat('river');
    } else if (phase === 'showdown') {
      resolveHand();
    }
  };

  const triggerNpcChat = (type: string) => {
    const npc = NPCS[Math.floor(Math.random() * NPCS.length)];
    if (type === 'start') setNpcChat(`${npc.name}: "${npc.phrase}"`);
    else if (type === 'flop') setNpcChat(`${npc.name}: "The plot thickens like bad gravy."`);
    else if (type === 'turn') setNpcChat(`${npc.name}: "I've got a bad feeling about this."`);
    else if (type === 'river') setNpcChat(`${npc.name}: "Final card. Show me your heart!"`);
  };

  const resolveHand = async () => {
    setLoading(true);
    // Simple logic for single player: evaluate best 5 of 7 cards
    const allCards = [...playerHand, ...communityCards];
    const { score, label } = evaluateTexasHoldem(allCards);
    
    // In this simplified solo version, score > threshold wins
    const multiplier = score > 15 ? 2.5 : 0; // Win if at least One Pair (Jacks or Better) or higher
    
    try {
      const result = await resolvePokerGame(bet, multiplier);
      setGold(result.newBalance);
      if (multiplier > 0) {
        setMessage(`WINNER! ${label}. You took the pot of ${Math.floor(bet * multiplier)}!`);
      } else {
        setMessage(`BUST. ${label}. The Saloon takes your gold.`);
      }
      setPhase('result');
    } catch (err: any) {
      alert(err.message);
      setPhase('betting');
    } finally {
      setLoading(false);
    }
  };

  const evaluateTexasHoldem = (cards: Card[]) => {
    // Basic scoring for simplified game
    const counts: Record<string, number> = {};
    cards.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
    const pairs = Object.entries(counts).filter(([_, count]) => count >= 2);
    
    if (pairs.length >= 2) return { score: 20, label: 'Two Pair or Better' };
    if (pairs.length === 1) return { score: 16, label: 'One Pair' };
    return { score: 5, label: 'High Card' };
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-8">
      
      {/* Dealer & NPCs Area */}
      <div className="grid grid-cols-3 gap-8 mb-12">
        {NPCS.map(npc => (
          <div key={npc.name} className="flex flex-col items-center space-y-4">
             <div className="w-24 h-24 bg-rust-950 border-4 border-sand-400 flex items-center justify-center text-5xl relative">
                {npc.avatar}
                <div className="absolute -bottom-2 bg-terracotta-400 text-rust-950 px-2 py-0.5 text-[10px] font-bold uppercase">{npc.name}</div>
             </div>
             {npcChat.startsWith(npc.name) && (
               <div className="panel-pixel py-2 px-4 bg-white text-rust-900 text-xs italic animate-in fade-in slide-in-from-top duration-500 shadow-none border-2 border-rust-900 relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white"></div>
                  {npcChat.split(': "')[1]?.replace('"', '')}
               </div>
             )}
          </div>
        ))}
      </div>

      {/* Table Center */}
      <div className="panel-pixel bg-green-950/40 border-sand-400 min-h-[350px] flex flex-col items-center justify-center relative space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.5)_inset]">
        <div className="absolute top-4 left-4 font-heading text-sand-500 opacity-50 uppercase tracking-widest">Community Pot: 💰 {pot}</div>
        
        {/* Community Cards */}
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-20 h-32 rounded border-4 flex items-center justify-center text-xl font-bold transition-all duration-500 ${communityCards[i] ? 'bg-white text-rust-900 border-sand-500 scale-100' : 'bg-rust-900/50 border-rust-900 border-dashed scale-95 opacity-50'}`}>
               {communityCards[i] ? `${communityCards[i].rank}${communityCards[i].suit}` : '?'}
            </div>
          ))}
        </div>

        <div className="text-2xl font-heading text-terracotta-400 tracking-widest animate-pulse">{message}</div>
      </div>

      {/* Player Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-8">
        
        <div className="flex items-center gap-8">
          <div className="panel-pixel p-4 bg-rust-950/80 border-sand-400 shadow-none text-center space-y-2">
             <p className="text-[10px] uppercase text-sand-500 font-bold">Your Hand</p>
             <div className="flex gap-2">
                {playerHand.map((card, i) => (
                  <div key={i} className="w-16 h-24 bg-white border-2 border-rust-900 rounded flex items-center justify-center text-lg font-bold text-rust-900 animate-in zoom-in duration-300">
                    {card.rank}{card.suit}
                  </div>
                ))}
                {playerHand.length === 0 && <div className="w-32 h-24 border-2 border-rust-900 border-dashed rounded opacity-20"></div>}
             </div>
          </div>
        </div>

        <div className="flex-1 max-w-md w-full">
           {phase === 'betting' ? (
             <div className="panel-pixel space-y-6">
                <div className="flex justify-between items-center text-sm uppercase font-bold text-sand-500">
                   <span>Ante Amount</span>
                   <span className="text-sand-300">💰 {bet}</span>
                </div>
                <div className="flex gap-2">
                   {[10, 25, 50, 100].map(val => (
                     <button key={val} onClick={() => setBet(val)} className={`btn-pixel text-[10px] flex-1 py-3 ${bet === val ? 'bg-sand-400 text-rust-950' : 'bg-rust-800'}`}>{val}</button>
                   ))}
                </div>
                <button onClick={startRound} className="btn-pixel w-full py-5 text-xl tracking-widest">BUY IN</button>
             </div>
           ) : phase === 'result' ? (
             <button onClick={() => { setPhase('betting'); setHand([]); setCommunity([]); setMessage('Care for another round?'); }} className="btn-pixel w-full py-6 text-xl tracking-widest">PLAY AGAIN</button>
           ) : (
             <button onClick={nextPhase} disabled={loading} className="btn-pixel w-full py-6 text-xl tracking-widest uppercase">
                {phase === 'showdown' ? 'SHOWDOWN' : `CONTINUE (${phase})`}
             </button>
           )}
        </div>

      </div>

    </div>
  );
}

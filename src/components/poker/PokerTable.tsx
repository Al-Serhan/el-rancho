'use client';

import { useState } from 'react';
import { resolvePokerGame } from '@/app/actions/poker';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  suit: Suit;
  rank: Rank;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

interface NPC {
  name: string;
  avatar: string;
  personality: 'aggressive' | 'cowardly' | 'balanced';
  hand: Card[];
  isFolded: boolean;
  phrase: string;
}

const INITIAL_NPCS: NPC[] = [
  { name: 'One-Eyed Pete', avatar: '👁️', personality: 'aggressive', hand: [], isFolded: false, phrase: 'I seen better hands in a graveyard!' },
  { name: 'Rusty Red', avatar: '🧔', personality: 'cowardly', hand: [], isFolded: false, phrase: 'I got a bad feeling about this...' },
  { name: 'AI Silas', avatar: '🤖', personality: 'balanced', hand: [], isFolded: false, phrase: 'Probabilities are... interesting.' }
];

export default function PokerTable({ initialGold }: { initialGold: number }) {
  const [gold, setGold] = useState(initialGold);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setHand] = useState<Card[]>([]);
  const [communityCards, setCommunity] = useState<Card[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [phase, setPhase] = useState<'betting' | 'flop' | 'turn' | 'river' | 'showdown' | 'result'>('betting');
  const [pot, setPot] = useState(0);
  const [bet, setBet] = useState(10);
  const [currentCall, setCurrentCall] = useState(0);
  const [message, setMessage] = useState('Step up to the table, partner.');
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
    if (gold < bet) return alert('Not enough gold!');
    
    const newDeck = createDeck();
    const playerHole = newDeck.splice(0, 2);
    
    const updatedNpcs = INITIAL_NPCS.map(npc => ({
      ...npc,
      hand: newDeck.splice(0, 2),
      isFolded: false
    }));

    setDeck(newDeck);
    setHand(playerHole);
    setNpcs(updatedNpcs);
    setCommunity([]);
    setPot(bet * 4);
    setGold(prev => prev - bet);
    setCurrentCall(bet);
    setPhase('flop');
    setMessage('The cards are dealt. Your move.');
    setNpcChat('One-Eyed Pete: "I\'m in. Let\'s see what you got."');
  };

  const handleAction = async (action: 'fold' | 'check' | 'call' | 'raise') => {
    if (action === 'fold') {
      setMessage('You folded. The Saloon takes your ante.');
      setPhase('result');
      return;
    }

    if (action === 'raise') {
      const raiseAmt = bet * 2;
      if (gold < raiseAmt) return alert('Not enough gold to raise!');
      setGold(prev => prev - raiseAmt);
      setPot(prev => prev + raiseAmt + (raiseAmt * 3)); // NPCs match
      setMessage(`You raised to ${raiseAmt}!`);
    }

    // Progress game
    const newDeck = [...deck];
    if (phase === 'flop') {
      setCommunity(newDeck.splice(0, 3));
      setPhase('turn');
    } else if (phase === 'turn') {
      setCommunity(prev => [...prev, newDeck.splice(0, 1)[0]]);
      setPhase('river');
    } else if (phase === 'river') {
      setCommunity(prev => [...prev, newDeck.splice(0, 1)[0]]);
      setPhase('showdown');
    } else if (phase === 'showdown') {
      await resolveShowdown();
    }
    setDeck(newDeck);
    triggerNpcReaction();
  };

  const triggerNpcReaction = () => {
    const activeNpcs = npcs.filter(n => !n.isFolded);
    const npc = activeNpcs[Math.floor(Math.random() * activeNpcs.length)];
    const reactions = [
      'Interesting move...',
      'You bluffing, boy?',
      'The desert sun is getting to ya.',
      'I\'ll stay for now.',
      'Show me the next one, dealer!'
    ];
    setNpcChat(`${npc.name}: "${reactions[Math.floor(Math.random() * reactions.length)]}"`);
  };

  const resolveShowdown = async () => {
    setLoading(true);
    const playerAll = [...playerHand, ...communityCards];
    const playerRank = evaluateHand(playerAll);

    let winCount = 0;
    npcs.forEach(npc => {
      const npcAll = [...npc.hand, ...communityCards];
      if (playerRank.score > evaluateHand(npcAll).score) winCount++;
    });

    const isWinner = winCount >= 2; // Win if better than at least 2 NPCs
    const multiplier = isWinner ? 3 : 0;

    try {
      const result = await resolvePokerGame(bet, multiplier);
      setGold(result.newBalance);
      if (isWinner) {
        setMessage(`WINNER! ${playerRank.label}. You took the pot!`);
      } else {
        setMessage(`LOSE. ${playerRank.label} wasn't enough.`);
      }
      setPhase('result');
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
      setPhase('betting');
    } finally {
      setLoading(false);
    }
  };

  const evaluateHand = (cards: Card[]) => {
    const counts: Record<string, number> = {};
    cards.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
    const pairs = Object.entries(counts).filter(([_, count]) => count >= 2);
    
    if (pairs.length >= 3) return { score: 30, label: 'Three Pair or Better' };
    if (pairs.length === 2) return { score: 20, label: 'Two Pair' };
    if (pairs.length === 1) return { score: 10, label: 'One Pair' };
    return { score: 5, label: 'High Card' };
  };

  return (
    <div className="space-y-16 max-w-7xl mx-auto py-12 font-pixel">
      
      {/* NPCs Area */}
      <div className="grid grid-cols-3 gap-12">
        {npcs.map(npc => (
          <div key={npc.name} className="flex flex-col items-center space-y-6">
             <div className={`w-32 h-32 bg-rust-950 border-8 flex items-center justify-center text-6xl relative shadow-2xl transition-all ${npc.isFolded ? 'opacity-30 grayscale border-rust-900' : 'border-sand-400'}`}>
                {npc.avatar}
                <div className="absolute -bottom-3 bg-terracotta-400 text-rust-950 px-4 py-1 text-xs font-bold uppercase tracking-widest border-2 border-rust-900">{npc.name}</div>
             </div>
             
             {/* NPC Cards Revealed at showdown */}
             {(phase === 'showdown' || phase === 'result') && (
               <div className="flex gap-2 animate-in zoom-in duration-500">
                  {npc.hand.map((c, i) => (
                    <div key={i} className="w-10 h-14 bg-white border-2 border-rust-900 rounded flex items-center justify-center text-xs font-bold text-rust-900">
                      {c.rank}{c.suit}
                    </div>
                  ))}
               </div>
             )}

             {npcChat.startsWith(npc.name) && (
               <div className="panel-pixel py-4 px-6 bg-white text-rust-900 text-base italic animate-in fade-in slide-in-from-top duration-500 shadow-none border-4 border-rust-900 relative max-w-[200px] text-center">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[12px] border-b-rust-900"></div>
                  &quot;{npcChat.split(': "')[1]?.replace('"', '')}&quot;
               </div>
             )}
          </div>
        ))}
      </div>

      {/* Table Center */}
      <div className="panel-pixel bg-green-950/60 border-sand-400 min-h-[450px] flex flex-col items-center justify-center relative space-y-12 shadow-[0_0_150px_rgba(0,0,0,0.9)_inset]">
        <div className="absolute top-8 left-8 font-heading text-sand-500 opacity-60 uppercase tracking-[0.3em] text-2xl">Pot: 💰 {pot}</div>
        
        <div className="flex gap-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-28 h-40 rounded-xl border-4 flex items-center justify-center text-3xl font-bold transition-all duration-700 shadow-2xl ${communityCards[i] ? 'bg-white text-rust-900 border-sand-200 scale-105' : 'bg-rust-900/30 border-rust-900 border-dashed scale-95 opacity-20'}`}>
               {communityCards[i] ? `${communityCards[i].rank}${communityCards[i].suit}` : ''}
            </div>
          ))}
        </div>

        <div className="text-4xl font-heading text-terracotta-400 tracking-[0.2em] animate-pulse text-center px-12 leading-relaxed h-12 flex items-center">
          {message}
        </div>
      </div>

      {/* Player Area */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-16 pt-16">
        
        <div className="panel-pixel p-10 bg-rust-950/90 border-sand-400 shadow-none text-center space-y-6 shrink-0 min-w-[300px]">
           <p className="text-sm uppercase text-sand-500 font-bold tracking-[0.3em]">Your Hole Cards</p>
           <div className="flex gap-6 justify-center">
              {playerHand.map((card, i) => (
                <div key={i} className="w-24 h-36 bg-white border-4 border-rust-900 rounded-xl flex items-center justify-center text-3xl font-bold text-rust-900 animate-in zoom-in duration-700 shadow-2xl hover:scale-110 transition-transform">
                  {card.rank}{card.suit}
                </div>
              ))}
              {playerHand.length === 0 && <div className="w-56 h-36 border-4 border-rust-900 border-dashed rounded-xl opacity-10"></div>}
           </div>
        </div>

        <div className="flex-1 max-w-2xl w-full">
           {phase === 'betting' ? (
             <div className="panel-pixel space-y-10 bg-rust-900/50 flex flex-col items-center">
                <div className="flex justify-between items-center w-full text-xl uppercase font-bold text-sand-500 tracking-widest">
                   <span>Initial Ante</span>
                   <span className="text-sand-200 text-4xl">💰 {bet}</span>
                </div>
                <div className="flex gap-4 w-full">
                   {[10, 25, 50, 100].map(val => (
                     <button key={val} onClick={() => setBet(val)} className={`btn-pixel text-sm flex-1 py-5 px-0 ${bet === val ? 'bg-sand-400 text-rust-950' : 'bg-rust-800'}`}>{val}</button>
                   ))}
                </div>
                <button onClick={startRound} className="btn-pixel w-full py-8 text-3xl tracking-[0.4em] font-heading">TAKE A SEAT</button>
             </div>
           ) : phase === 'result' ? (
             <button onClick={() => { setPhase('betting'); setHand([]); setCommunity([]); setMessage('Want to go again?'); setNpcChat(''); }} className="btn-pixel w-full py-10 text-3xl tracking-[0.3em] font-heading">PLAY ANOTHER ROUND</button>
           ) : (
             <div className="grid grid-cols-2 gap-6 w-full">
                <button onClick={() => handleAction('fold')} className="btn-pixel bg-rust-800 border-rust-950 text-sand-600 text-sm py-6">FOLD</button>
                <button onClick={() => handleAction('check')} className="btn-pixel bg-sand-400 text-rust-900 border-sand-600 text-sm py-6 uppercase tracking-widest">
                   {phase === 'showdown' ? 'SHOWDOWN' : 'CHECK / CALL'}
                </button>
                <button onClick={() => handleAction('raise')} className="btn-pixel bg-terracotta-400 text-rust-900 border-terracotta-600 text-sm py-6 col-span-2 uppercase tracking-[0.2em] font-bold">RAISE STAKES (x2)</button>
             </div>
           )}
        </div>

      </div>

    </div>
  );
}

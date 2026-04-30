'use client';

import { useState } from 'react';
import { resolvePokerGame } from '@/app/actions/poker';
import { incrementHonor } from '@/app/actions/honor';

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

import Image from 'next/image';
import { useSound } from '@/hooks/useSound';

const INITIAL_NPCS: NPC[] = [
  { name: 'One-Eyed Mossy', avatar: '/avatars/pete.png', personality: 'aggressive', hand: [], isFolded: false, phrase: 'I seen better hands in a graveyard!' },
  { name: 'Feller Epilex', avatar: '/avatars/rusty.png', personality: 'cowardly', hand: [], isFolded: false, phrase: 'I got a bad feeling about this...' },
  { name: 'AI Silas', avatar: '/avatars/silas.png', personality: 'balanced', hand: [], isFolded: false, phrase: 'Probabilities are... interesting.' }
];

export default function PokerTable({ initialGold }: { initialGold: number }) {
  const [gold, setGold] = useState(initialGold);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setHand] = useState<Card[]>([]);
  const [communityCards, setCommunity] = useState<Card[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [phase, setPhase] = useState<'betting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'result'>('betting');
  const [pot, setPot] = useState(0);
  const [bet, setBet] = useState(10);
  const [invested, setInvested] = useState(0);
  const [message, setMessage] = useState('Step up to the table, partner.');
  const [npcChat, setNpcChat] = useState<string>('');
  const [honorCue, setHonorCue] = useState<string | null>(null);
  const { playSound } = useSound();

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
    setInvested(bet);
    setPhase('preflop');
    setMessage('The cards are dealt. Your move.');
    setNpcChat('One-Eyed Mossy: "I\'m in. Let\'s see what you got."');
    playSound('deal');
  };

  const handleAction = async (action: 'fold' | 'check' | 'call' | 'raise') => {
    if (action === 'fold') {
      setMessage('You folded. The Saloon takes your ante.');
      await resolveShowdown(false, true);
      return;
    }

    if (action === 'raise') {
      const raiseAmt = bet * 2;
      if (gold < raiseAmt) return alert('Not enough gold to raise!');
      
      setGold(prev => prev - raiseAmt);
      setInvested(prev => prev + raiseAmt);
      
      let foldCount = 0;
      const updatedNpcs = npcs.map(npc => {
        if (npc.isFolded) return npc;
        
        const npcAll = [...npc.hand, ...communityCards];
        const rank = evaluateHand(npcAll);
        
        // Thresholds based on new scoring (Category * 1,000,000)
        let foldThreshold = 10000; // High Card
        if (npc.personality === 'cowardly') foldThreshold = 1100000; // Pair of Jacks or better-ish
        if (npc.personality === 'balanced') foldThreshold = 1000000; // Any pair
        if (npc.personality === 'aggressive') foldThreshold = 0; // Never fold
        
        if (rank.score < foldThreshold) {
          foldCount++;
          return { ...npc, isFolded: true };
        }
        return npc;
      });
      
      setNpcs(updatedNpcs);
      const activeNpcs = updatedNpcs.filter(n => !n.isFolded);
      setPot(prev => prev + raiseAmt + (raiseAmt * activeNpcs.length));
      
      if (activeNpcs.length === 0) {
        setMessage('Everyone folded! The pot is yours.');
        await resolveShowdown(true);
        return;
      }

      setMessage(`You raised to ${raiseAmt}! ${foldCount > 0 ? `${foldCount} folded.` : 'Everyone calls.'}`);
      triggerNpcReaction(updatedNpcs);
      return;
    }

    // Progress game on Check/Call
    const newDeck = [...deck];
    if (phase === 'preflop') {
      setCommunity(newDeck.splice(0, 3));
      setPhase('flop');
      setMessage('The flop is dealt. What\'s your move?');
    } else if (phase === 'flop') {
      setCommunity(prev => [...prev, ...newDeck.splice(0, 1)]);
      setPhase('turn');
      setMessage('The turn is out. Stakes are rising.');
    } else if (phase === 'turn') {
      setCommunity(prev => [...prev, ...newDeck.splice(0, 1)]);
      setPhase('river');
      setMessage('The river has run dry. One last chance.');
    } else if (phase === 'river') {
      setPhase('showdown');
      setMessage('Showdown! Let\'s see those cards.');
    } else if (phase === 'showdown') {
      await resolveShowdown();
    }
    setDeck(newDeck);
    triggerNpcReaction();
  };

  const triggerNpcReaction = (currentNpcs = npcs) => {
    const activeNpcs = currentNpcs.filter(n => !n.isFolded);
    if (activeNpcs.length === 0) return;
    const npc = activeNpcs[Math.floor(Math.random() * activeNpcs.length)];
    
    let reactions = ['I\'ll stay.', 'Next card, dealer.', 'Hmm.'];
    if (npc.personality === 'aggressive') reactions = [
      'You trying to buy this pot?', 
      'I seen better hands in a graveyard!', 
      'Raise it up, coward!', 
      'Don\'t blink, kid. I can smell your fear.',
      'My horse plays better poker than you.',
      'Are you gonna bet or just sit there lookin\' pretty?'
    ];
    if (npc.personality === 'cowardly') reactions = [
      'I got a bad feeling about this...', 
      'The desert sun is getting to ya.', 
      'Is it hot in here? I\'m sweatin\' bullets.', 
      'I\'m just here for the sarsaparilla.',
      'Please don\'t take all my gold, I got a mule to feed.',
      'Fold? Me? No, just... resting my eyes.'
    ];
    if (npc.personality === 'balanced') reactions = [
      'Interesting move... statistically unwise, but interesting.', 
      'Probabilities suggest you are bluffing 87.3% of the time.', 
      'Show me the next one. My circuits are ready.', 
      'Fair enough. I have calculated all outcomes.',
      'Your heart rate elevated when you checked. Fascinating.',
      'Processing bet... Acceptable risk parameter.'
    ];
    
    setNpcChat(`${npc.name}: "${reactions[Math.floor(Math.random() * reactions.length)]}"`);
  };

  const resolveShowdown = async (autoWin = false, playerFolded = false) => {
    const playerAll = [...playerHand, ...communityCards];
    const playerRank = evaluateHand(playerAll);

    const npcResults = npcs.filter(n => !n.isFolded).map(npc => ({
      name: npc.name,
      rank: evaluateHand([...npc.hand, ...communityCards])
    }));

    let isWinner = false;
    if (playerFolded) {
      isWinner = false;
    } else if (autoWin || npcResults.length === 0) {
      isWinner = true;
    } else {
      const bestNpc = npcResults.reduce((prev, curr) => (prev.rank.score > curr.rank.score) ? prev : curr);
      isWinner = playerRank.score >= bestNpc.rank.score;
    }

    const winnings = isWinner ? pot : 0;

    try {
      const result = await resolvePokerGame(invested, winnings);
      setGold(result.newBalance);
      if (playerFolded) {
        setMessage('You folded. Better luck next time.');
      } else if (isWinner) {
        setMessage(autoWin ? 'WINNER! Everyone folded.' : `WINNER! ${playerRank.label}. You took the pot!`);
        playSound('win');
        incrementHonor(10);
        setHonorCue('+10 HONOR');
        setTimeout(() => setHonorCue(null), 3000);
      } else {
        setMessage(`LOSE. ${playerRank.label} wasn't enough.`);
        playSound('error');
      }
      setPhase('result');
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
      setPhase('betting');
    }
  };

  const getSuitColor = (suit: Suit) => (suit === '♥' || suit === '♦') ? 'text-red-600' : 'text-rust-900';

  const evaluateHand = (handCards: Card[]) => {
    if (handCards.length < 2) return { score: 0, label: 'Evaluating...' };

    const rV: Record<Rank, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    const counts: Record<string, number> = {};
    const suitCounts: Record<Suit, number> = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
    handCards.forEach(c => {
      counts[c.rank] = (counts[c.rank] || 0) + 1;
      suitCounts[c.suit]++;
    });

    const ranks = handCards.map(c => rV[c.rank]).sort((a, b) => b - a);
    const uR = Array.from(new Set(ranks)).sort((a, b) => b - a);

    // Categories: 8: SF, 7: 4K, 6: FH, 5: Flush, 4: Straight, 3: 3K, 2: 2P, 1: 1P, 0: HC
    let category = 0;
    let label = 'High Card';
    let mainRank = ranks[0];
    let secondaryRank = 0;

    // Check Flush
    let flushSuit: Suit | null = null;
    for (const suit of SUITS) { if (suitCounts[suit] >= 5) flushSuit = suit; }

    // Check Straight
    let isStraight = false;
    let straightHigh = 0;
    for (let i = 0; i <= uR.length - 5; i++) {
      if (uR[i] - uR[i+4] === 4) { isStraight = true; straightHigh = uR[i]; break; }
    }
    if (!isStraight && uR.includes(14) && uR.includes(2) && uR.includes(3) && uR.includes(4) && uR.includes(5)) {
      isStraight = true; straightHigh = 5;
    }

    // Straight Flush
    if (flushSuit && isStraight) {
      const fR = handCards.filter(c => c.suit === flushSuit).map(c => rV[c.rank]).sort((a, b) => b - a);
      const fuR = Array.from(new Set(fR));
      for (let i = 0; i <= fuR.length - 5; i++) {
        if (fuR[i] - fuR[i+4] === 4) { category = 8; straightHigh = fuR[i]; break; }
      }
      if (category === 0 && fuR.includes(14) && fuR.includes(2) && fuR.includes(3) && fuR.includes(4) && fuR.includes(5)) {
        category = 8; straightHigh = 5;
      }
      if (category === 8) { label = 'Straight Flush'; mainRank = straightHigh; }
    }

    if (category === 0) {
      const entries = Object.entries(counts).map(([rank, count]) => ({ rank: rV[rank as Rank], count })).sort((a, b) => b.count - a.count || b.rank - a.rank);
      if (entries[0].count === 4) { category = 7; label = 'Four of a Kind'; mainRank = entries[0].rank; }
      else if (entries[0].count === 3 && entries[1]?.count >= 2) { category = 6; label = 'Full House'; mainRank = entries[0].rank; secondaryRank = entries[1].rank; }
      else if (flushSuit) { category = 5; label = 'Flush'; mainRank = ranks[0]; }
      else if (isStraight) { category = 4; label = 'Straight'; mainRank = straightHigh; }
      else if (entries[0].count === 3) { category = 3; label = 'Three of a Kind'; mainRank = entries[0].rank; }
      else if (entries[0].count === 2 && entries[1]?.count === 2) { category = 2; label = 'Two Pair'; mainRank = entries[0].rank; secondaryRank = entries[1].rank; }
      else if (entries[0].count === 2) { category = 1; label = 'One Pair'; mainRank = entries[0].rank; }
      else { category = 0; label = 'High Card'; mainRank = ranks[0]; }
    }

    const kickerScore = ranks.slice(0, 5).reduce((acc, r, i) => acc + r * Math.pow(15, 4 - i), 0);
    const finalScore = category * 1000000 + mainRank * 10000 + secondaryRank * 100 + kickerScore / 100;

    return { score: finalScore, label };
  };

  return (
    <div className="space-y-16 max-w-7xl mx-auto py-12 font-pixel">
      
      {/* NPCs Area */}
      <div className="grid grid-cols-3 gap-12">
        {npcs.map(npc => (
          <div key={npc.name} className="flex flex-col items-center space-y-6">
             <div className="flex flex-col items-center gap-3">
               <div className={`w-32 h-32 bg-rust-950 border-8 flex items-center justify-center relative shadow-2xl transition-all overflow-hidden ${npc.isFolded ? 'opacity-30 grayscale border-rust-900' : 'border-sand-400'}`}>
                  <Image src={npc.avatar} alt={npc.name} fill className="pixelated object-cover" unoptimized />
               </div>
               <div className="bg-rust-900 text-sand-400 px-4 py-2 text-base font-bold uppercase tracking-widest border-2 border-rust-950 shadow-md">{npc.name}</div>
             </div>
             
             {/* NPC Cards Revealed at result */}
             {(phase === 'result') && (
               <div className="flex gap-2 animate-in zoom-in duration-500">
                  {npc.hand.map((c, i) => (
                    <div key={i} className={`w-10 h-14 bg-white border-2 border-rust-900 rounded flex items-center justify-center text-lg font-bold ${npc.isFolded ? 'opacity-50' : 'text-rust-900'}`}>
                      {c.rank}<span className={getSuitColor(c.suit)}>{c.suit}</span>
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
               {communityCards[i] ? (
                 <>
                   {communityCards[i].rank}<span className={getSuitColor(communityCards[i].suit)}>{communityCards[i].suit}</span>
                 </>
               ) : ''}
            </div>
          ))}
        </div>

        <div className="text-4xl font-heading text-terracotta-400 tracking-[0.2em] animate-pulse text-center px-12 leading-relaxed h-12 flex items-center">
          {message}
        </div>
        {honorCue && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-heading text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,1)] z-50 animate-bounce">
            {honorCue}
          </div>
        )}
      </div>

      {/* Player Area */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-16 pt-16">
        
        <div className="panel-pixel p-10 bg-rust-950/90 border-sand-400 shadow-none text-center space-y-6 shrink-0 min-w-[300px]">
           <p className="text-xl uppercase text-sand-500 font-bold tracking-[0.3em]">Your Hole Cards</p>
           <div className="flex gap-6 justify-center">
              {playerHand.map((card, i) => (
                <div key={i} className="w-24 h-36 bg-white border-4 border-rust-900 rounded-xl flex items-center justify-center text-3xl font-bold text-rust-900 animate-in zoom-in duration-700 shadow-2xl hover:scale-110 transition-transform">
                  {card.rank}<span className={getSuitColor(card.suit)}>{card.suit}</span>
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
                     <button key={val} onClick={() => setBet(val)} className={`btn-pixel flex-1 py-5 px-0 ${bet === val ? 'bg-sand-400 text-rust-950' : 'bg-rust-800'}`}>{val}</button>
                   ))}
                </div>
                <button onClick={startRound} className="btn-pixel w-full py-8 text-3xl tracking-[0.4em] font-heading">TAKE A SEAT</button>
             </div>
           ) : phase === 'result' ? (
             <button onClick={() => { setPhase('betting'); setHand([]); setCommunity([]); setMessage('Want to go again?'); setNpcChat(''); setInvested(0); }} className="btn-pixel w-full py-10 text-3xl tracking-[0.3em] font-heading">PLAY ANOTHER ROUND</button>
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

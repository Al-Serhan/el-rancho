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

  // --- NPC AI: Decides what each bot does on their turn ---
  const processNpcTurns = (currentNpcs: NPC[], currentCommunity: Card[], currentBet: number): {
    updatedNpcs: NPC[];
    potChange: number;
    actions: string[];
  } => {
    let potChange = 0;
    const actions: string[] = [];

    const updatedNpcs = currentNpcs.map(npc => {
      if (npc.isFolded) return npc;

      const npcAll = [...npc.hand, ...currentCommunity];
      const rank = evaluateHand(npcAll);
      const score = rank.score;

      // --- FOLD LOGIC ---
      let foldChance = 0;
      if (npc.personality === 'cowardly') {
        if (score < 1000000) foldChance = 0.55;       // No pair → 55% fold
        else if (score < 1050000) foldChance = 0.25;   // Low pair → 25% fold
      } else if (npc.personality === 'balanced') {
        if (score < 500000) foldChance = 0.35;         // Trash hand → 35% fold
        else if (score < 1000000) foldChance = 0.15;   // High card → 15% fold
      } else { // aggressive
        if (score < 100000) foldChance = 0.08;         // Absolute garbage → 8% fold
      }

      if (currentCommunity.length >= 3 && Math.random() < foldChance) {
        actions.push(`${npc.name} folds!`);
        return { ...npc, isFolded: true };
      }

      // --- RAISE LOGIC ---
      let raiseChance = 0;
      if (npc.personality === 'aggressive') {
        if (score >= 2000000) raiseChance = 0.85;      // Two pair+ → 85%
        else if (score >= 1000000) raiseChance = 0.50;  // Any pair → 50%
        else raiseChance = 0.25;                        // Bluff raise! → 25%
      } else if (npc.personality === 'balanced') {
        if (score >= 3000000) raiseChance = 0.70;      // Three of a kind+ → 70%
        else if (score >= 2000000) raiseChance = 0.40;  // Two pair → 40%
        else if (score >= 1000000) raiseChance = 0.15;  // Pair → 15%
      } else { // cowardly
        if (score >= 4000000) raiseChance = 0.50;      // Straight+ → 50%
        else if (score >= 2000000) raiseChance = 0.15;  // Two pair → 15%
      }

      if (Math.random() < raiseChance) {
        const raiseAmt = currentBet;
        potChange += raiseAmt;

        // Determine if it's a bluff (raising with a weak hand)
        const isBluff = score < 1000000;
        if (isBluff) {
          actions.push(`${npc.name} raises! 💀 (Bluff?)`);
        } else {
          actions.push(`${npc.name} raises! 💰`);
        }
        return npc;
      }

      // --- CHECK/CALL ---
      actions.push(`${npc.name} calls.`);
      return npc;
    });

    return { updatedNpcs, potChange, actions };
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
      
      // NPC response to player's raise — they evaluate whether to fold, call, or re-raise
      const { updatedNpcs, potChange, actions } = processNpcTurns(npcs, communityCards, bet);
      
      setNpcs(updatedNpcs);
      const activeNpcs = updatedNpcs.filter(n => !n.isFolded);
      setPot(prev => prev + raiseAmt + potChange + (bet * activeNpcs.length));
      
      if (activeNpcs.length === 0) {
        setMessage('Everyone folded! The pot is yours.');
        await resolveShowdown(true);
        return;
      }

      const foldCount = updatedNpcs.filter(n => n.isFolded).length - npcs.filter(n => n.isFolded).length;
      const raiseCount = actions.filter(a => a.includes('raises')).length;
      let msg = `You raised to ${raiseAmt}!`;
      if (foldCount > 0) msg += ` ${foldCount} folded.`;
      if (raiseCount > 0) msg += ` ${raiseCount} re-raised!`;
      if (foldCount === 0 && raiseCount === 0) msg += ' Everyone calls.';
      
      setMessage(msg);
      showNpcAction(actions, updatedNpcs);
      return;
    }

    // Progress game on Check/Call
    const newDeck = [...deck];
    let nextCommunity = communityCards;
    if (phase === 'preflop') {
      nextCommunity = newDeck.splice(0, 3);
      setCommunity(nextCommunity);
      setPhase('flop');
    } else if (phase === 'flop') {
      const newCards = newDeck.splice(0, 1);
      nextCommunity = [...communityCards, ...newCards];
      setCommunity(nextCommunity);
      setPhase('turn');
    } else if (phase === 'turn') {
      const newCards = newDeck.splice(0, 1);
      nextCommunity = [...communityCards, ...newCards];
      setCommunity(nextCommunity);
      setPhase('river');
    } else if (phase === 'river') {
      setPhase('showdown');
      setMessage('Showdown! Let\'s see those cards.');
      setDeck(newDeck);
      return;
    } else if (phase === 'showdown') {
      await resolveShowdown();
      setDeck(newDeck);
      return;
    }
    setDeck(newDeck);

    // NPC turns after community cards are dealt
    const { updatedNpcs, potChange, actions } = processNpcTurns(npcs, nextCommunity, bet);
    setNpcs(updatedNpcs);
    setPot(prev => prev + potChange);

    const activeNpcs = updatedNpcs.filter(n => !n.isFolded);
    if (activeNpcs.length === 0) {
      setMessage('Everyone folded! The pot is yours.');
      await resolveShowdown(true);
      return;
    }

    // Build a contextual message
    const foldCount = actions.filter(a => a.includes('folds')).length;
    const raiseCount = actions.filter(a => a.includes('raises')).length;
    let phaseMsg = '';
    if (phase === 'flop' || nextCommunity.length === 3) phaseMsg = 'The flop is dealt.';
    else if (phase === 'turn' || nextCommunity.length === 4) phaseMsg = 'The turn is out.';
    else if (phase === 'river' || nextCommunity.length === 5) phaseMsg = 'The river has run dry.';
    
    if (raiseCount > 0) phaseMsg += ` ${raiseCount} bot${raiseCount > 1 ? 's' : ''} raised!`;
    if (foldCount > 0) phaseMsg += ` ${foldCount} folded.`;
    if (raiseCount === 0 && foldCount === 0) phaseMsg += ' What\'s your move?';
    
    setMessage(phaseMsg);
    showNpcAction(actions, updatedNpcs);
  };

  const showNpcAction = (actions: string[], currentNpcs: NPC[]) => {
    // Find the most interesting action to show as chat
    const raiseAction = actions.find(a => a.includes('raises'));
    const foldAction = actions.find(a => a.includes('folds'));
    const actionToShow = raiseAction || foldAction || actions[0];
    
    if (!actionToShow) return;
    
    const npcName = actionToShow.split(' ')[0] + ' ' + actionToShow.split(' ')[1];
    const npc = currentNpcs.find(n => actionToShow.startsWith(n.name));
    
    if (!npc) {
      triggerNpcReaction(currentNpcs);
      return;
    }

    // Context-sensitive quotes
    if (actionToShow.includes('Bluff')) {
      const bluffQuotes: Record<string, string[]> = {
        'aggressive': [
          'I\'m ALL in. You scared?',
          'My hand is so good it\'d make a grown man cry.',
          'You don\'t wanna see what I\'m holdin\'.',
          'Raise. I don\'t even need to look at my cards.',
        ],
        'cowardly': [
          'I... I raise! Please don\'t call...',
          'Oh no. What did I just do.',
          'I\'m probably going to regret this.',
        ],
        'balanced': [
          'Statistically... this is inadvisable. Raising anyway.',
          'Running bluff subroutine. Confidence at 12%.',
          'Illogical play engaged. For science.',
        ],
      };
      const quotes = bluffQuotes[npc.personality] || bluffQuotes['aggressive'];
      setNpcChat(`${npc.name}: "${quotes[Math.floor(Math.random() * quotes.length)]}"`);
    } else if (actionToShow.includes('raises')) {
      const raiseQuotes: Record<string, string[]> = {
        'aggressive': [
          'Raise! Put up or shut up!',
          'I\'m doubling down. You ain\'t got the nerve.',
          'More gold in the pot. Let\'s make this interesting.',
          'You think you can outplay ME? Raise!',
        ],
        'cowardly': [
          'Okay... I\'m raising. My hands are shaking but I\'m raising.',
          'This might be the best hand I\'ve ever had. RAISE!',
          'The stars must be aligned... I raise.',
        ],
        'balanced': [
          'Optimal play detected: raise.',
          'Expected value positive. Raising.',
          'My calculations favor aggressive action here.',
        ],
      };
      const quotes = raiseQuotes[npc.personality] || raiseQuotes['aggressive'];
      setNpcChat(`${npc.name}: "${quotes[Math.floor(Math.random() * quotes.length)]}"`);
    } else if (actionToShow.includes('folds')) {
      const foldQuotes: Record<string, string[]> = {
        'aggressive': [
          'Fine! I fold. But I\'ll be back.',
          'This hand ain\'t worth my spit. Fold.',
        ],
        'cowardly': [
          'Nope. Nope nope nope. I\'m out.',
          'I fold! I can\'t take the pressure!',
          'My mule needs me alive. I fold.',
          'I knew I shoulda stayed in bed today.',
        ],
        'balanced': [
          'Probability of winning: 3.2%. Folding.',
          'Insufficient hand strength. Retreating.',
          'Logic dictates I preserve my resources. Fold.',
        ],
      };
      const quotes = foldQuotes[npc.personality] || foldQuotes['cowardly'];
      setNpcChat(`${npc.name}: "${quotes[Math.floor(Math.random() * quotes.length)]}"`);
    } else {
      triggerNpcReaction(currentNpcs);
    }
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

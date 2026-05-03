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
  const [showRules, setShowRules] = useState(false);
  const { playSound } = useSound();

  const createDeck = () => {
    const newDeck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        newDeck.push({ suit, rank });
      }
    }
    // Fisher-Yates Shuffle using Cryptographically Secure Pseudo-Randomness (CSPRNG)
    for (let i = newDeck.length - 1; i > 0; i--) {
      const randomBuffer = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuffer);
      const randomFraction = randomBuffer[0] / (0xffffffff + 1);
      
      const j = Math.floor(randomFraction * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
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

      const rV: Record<Rank, number> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

      // --- FOLD LOGIC ---
      let foldChance = 0;
      let hasDraw = false;

      if (currentCommunity.length > 0) {
        // Check for flush draw
        const suitCounts: Record<string, number> = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
        npcAll.forEach(c => suitCounts[c.suit]++);
        hasDraw = Object.values(suitCounts).some(count => count === 4);
      }

      if (currentCommunity.length === 0) {
        // Pre-flop logic
        const rank1 = rV[npc.hand[0].rank];
        const rank2 = rV[npc.hand[1].rank];
        const highCard = Math.max(rank1, rank2);
        const lowCard = Math.min(rank1, rank2);
        const isSuited = npc.hand[0].suit === npc.hand[1].suit;
        const isPair = rank1 === rank2;

        let isTrash = false;
        if (!isPair && !isSuited && highCard < 10) isTrash = true;
        if (!isPair && highCard < 13 && lowCard < 7) isTrash = true;

        if (npc.personality === 'cowardly') foldChance = isTrash ? 0.75 : 0.1;
        else if (npc.personality === 'balanced') foldChance = isTrash ? 0.45 : 0.05;
        else foldChance = isTrash ? 0.2 : 0;
        
      } else {
        // Post-flop logic
        if (npc.personality === 'cowardly') {
          if (score < 1000000 && !hasDraw) foldChance = 0.55;
          else if (score < 1050000) foldChance = 0.25;
        } else if (npc.personality === 'balanced') {
          if (score < 500000 && !hasDraw) foldChance = 0.35;
          else if (score < 1000000 && !hasDraw) foldChance = 0.15;
        } else { // aggressive
          if (score < 1000000 && !hasDraw) foldChance = 0.25;
          else foldChance = 0.05;
        }
      }

      // Add a slight variance so it's not strictly deterministic
      if (Math.random() < foldChance) {
        actions.push(`${npc.name} folds${currentCommunity.length === 0 ? ' pre-flop' : ''}!`);
        return { ...npc, isFolded: true };
      }

      // --- RAISE LOGIC ---
      let raiseChance = 0;
      let raiseMultiplier = 1;
      
      if (npc.personality === 'aggressive') {
        if (score >= 2000000) { raiseChance = 0.80; raiseMultiplier = Math.random() > 0.4 ? 2 : 1; }
        else if (score >= 1000000) raiseChance = 0.40;
        else raiseChance = 0.15; // Bluff raise
      } else if (npc.personality === 'balanced') {
        if (score >= 3000000) { raiseChance = 0.70; raiseMultiplier = Math.random() > 0.6 ? 1.5 : 1; }
        else if (score >= 2000000) raiseChance = 0.40;
        else if (score >= 1000000) raiseChance = 0.15;
      } else { // cowardly
        if (score >= 4000000) raiseChance = 0.50;
        else if (score >= 2000000) raiseChance = 0.15;
      }

      if (Math.random() < raiseChance) {
        const raiseAmt = Math.floor(currentBet * raiseMultiplier);
        potChange += raiseAmt;

        const isBluff = score < 1000000;
        if (isBluff) {
          actions.push(`${npc.name} raises! 💀 (Bluff?)`);
        } else if (raiseMultiplier > 1) {
          actions.push(`${npc.name} raises big! 🔥`);
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

  const handleAction = async (action: 'fold' | 'check' | 'call' | 'raise' | 'all-in') => {
    if (action === 'fold') {
      setMessage('You folded. The Saloon takes your ante.');
      await resolveShowdown(false, true);
      return;
    }

    if (action === 'raise' || action === 'all-in') {
      const raiseAmt = action === 'all-in' ? gold : bet * 2;
      if (action !== 'all-in' && gold < raiseAmt) return alert('Not enough gold to raise!');
      if (action === 'all-in' && gold <= 0) return alert('You have no gold to go all in!');
      
      setGold(prev => prev - raiseAmt);
      setInvested(prev => prev + raiseAmt);
      
      // NPC response to player's raise — they evaluate whether to fold, call, or re-raise
      const { updatedNpcs, potChange, actions } = processNpcTurns(npcs, communityCards, raiseAmt);
      
      setNpcs(updatedNpcs);
      const activeNpcs = updatedNpcs.filter(n => !n.isFolded);
      setPot(prev => prev + raiseAmt + potChange + (raiseAmt * activeNpcs.length));
      
      if (activeNpcs.length === 0) {
        setMessage('Everyone folded! The pot is yours.');
        await resolveShowdown(true);
        return;
      }

      const foldCount = updatedNpcs.filter(n => n.isFolded).length - npcs.filter(n => n.isFolded).length;
      const raiseCount = actions.filter(a => a.includes('raises')).length;
      let msg = action === 'all-in' ? `You went ALL IN!` : `You raised to ${raiseAmt}!`;
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
    if (nextCommunity.length === 3) phaseMsg = 'The flop is dealt.';
    else if (nextCommunity.length === 4) phaseMsg = 'The turn is out.';
    else if (nextCommunity.length === 5) phaseMsg = 'The river has run dry.';
    
    if (raiseCount > 0) phaseMsg += ` ${raiseCount} bot${raiseCount > 1 ? 's' : ''} raised!`;
    if (foldCount > 0) phaseMsg += ` ${foldCount} folded.`;
    if (raiseCount === 0 && foldCount === 0) phaseMsg += ' What\'s your move?';
    
    setMessage(phaseMsg);
    showNpcAction(actions, updatedNpcs);
  };

  const showNpcAction = (actions: string[], currentNpcs: NPC[]) => {
    // Shuffle actions to ensure fairness when multiple bots act
    const shuffledActions = [...actions].sort(() => Math.random() - 0.5);
    const raiseAction = shuffledActions.find(a => a.includes('raises'));
    const foldAction = shuffledActions.find(a => a.includes('folds'));
    const actionToShow = raiseAction || foldAction || shuffledActions[0];
    
    if (!actionToShow) return;
    
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
    let winningNpc = null;
    
    if (playerFolded) {
      isWinner = false;
      if (npcResults.length > 0) {
        winningNpc = npcResults.reduce((prev, curr) => (prev.rank.score > curr.rank.score) ? prev : curr);
      }
    } else if (autoWin || npcResults.length === 0) {
      isWinner = true;
    } else {
      winningNpc = npcResults.reduce((prev, curr) => (prev.rank.score > curr.rank.score) ? prev : curr);
      isWinner = playerRank.score >= winningNpc.rank.score;
    }

    const winnings = isWinner ? pot : 0;

    try {
      const result = await resolvePokerGame(invested, winnings);
      setGold(result.newBalance);
      if (playerFolded) {
        if (winningNpc) {
          setMessage(`You folded. ${winningNpc.name} won with a ${winningNpc.rank.label}.`);
        } else {
          setMessage('You folded. The Saloon takes your ante.');
        }
      } else if (isWinner) {
        setMessage(autoWin ? 'You won! Everyone folded.' : `WINNER! You won with a ${playerRank.label}!`);
        playSound('win');
        incrementHonor(10);
        setHonorCue('+10 HONOR');
        setTimeout(() => setHonorCue(null), 3000);
      } else {
        setMessage(`LOSE. ${winningNpc?.name} won with a ${winningNpc?.rank.label}.`);
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
    <div className="space-y-8 max-w-7xl mx-auto py-6 font-pixel">
      
      {/* NPCs Area */}
      <div className="grid grid-cols-3 gap-4">
        {npcs.map(npc => (
          <div key={npc.name} className="flex flex-col items-center space-y-4">
             <div className="flex flex-col items-center gap-2">
               <div className={`w-20 h-20 bg-rust-950 border-4 flex items-center justify-center relative shadow-xl transition-all overflow-hidden ${npc.isFolded ? 'opacity-30 grayscale border-rust-900' : 'border-sand-400'}`}>
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
      <div className="panel-pixel bg-green-950/60 border-sand-400 min-h-[300px] flex flex-col items-center justify-center relative space-y-6 shadow-[0_0_150px_rgba(0,0,0,0.9)_inset]">
        <div className="absolute top-4 left-6 font-heading text-sand-500 opacity-60 uppercase tracking-[0.3em] text-xl">Pot: 💰 {pot}</div>
        
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
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-8">
        
        <div className="panel-pixel p-6 bg-rust-950/90 border-sand-400 shadow-none text-center space-y-4 shrink-0 min-w-[260px]">
           <p className="text-lg uppercase text-sand-500 font-bold tracking-[0.2em]">Your Hole Cards</p>
           <div className="flex gap-4 justify-center">
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
                <button onClick={() => handleAction('raise')} className="btn-pixel bg-terracotta-400 text-rust-900 border-terracotta-600 text-sm py-6 uppercase tracking-[0.2em] font-bold">RAISE STAKES (x2)</button>
                <button onClick={() => handleAction('all-in')} className="btn-pixel bg-red-700 text-white border-red-900 text-sm py-6 uppercase tracking-[0.2em] font-bold hover:bg-red-600">ALL IN</button>
             </div>
           )}
        </div>

      </div>

      {/* Rules Button */}
      <button 
        onClick={() => setShowRules(true)}
        className="fixed right-4 top-1/2 -translate-y-1/2 btn-pixel bg-sand-400 text-rust-900 rotate-90 origin-right py-2 px-4 text-sm z-40 shadow-lg whitespace-nowrap"
      >
        POKER RULES
      </button>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="panel-pixel bg-rust-950 border-sand-400 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative p-8">
            <button 
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 text-sand-500 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
            <h2 className="text-3xl font-heading text-terracotta-400 mb-6 tracking-widest text-center">Poker Rules</h2>
            <div className="space-y-4 text-sand-200 text-sm leading-relaxed">
              <p>Welcome to El Rancho Texas Hold&apos;em! Here&apos;s how to play:</p>
              
              <h3 className="text-xl text-sand-400 mt-6 mb-2 font-heading">The Basics</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You receive 2 private cards (hole cards).</li>
                <li>5 community cards are dealt to the center of the table.</li>
                <li>Make the best 5-card hand using any combination of your cards and community cards.</li>
              </ul>

              <h3 className="text-xl text-sand-400 mt-6 mb-2 font-heading">Hand Rankings (Highest to Lowest)</h3>
              <ol className="list-decimal pl-6 space-y-1">
                <li><strong className="text-white">Royal Flush:</strong> A, K, Q, J, 10, all same suit.</li>
                <li><strong className="text-white">Straight Flush:</strong> Five cards in a sequence, all same suit.</li>
                <li><strong className="text-white">Four of a Kind:</strong> All four cards of the same rank.</li>
                <li><strong className="text-white">Full House:</strong> Three of a kind with a pair.</li>
                <li><strong className="text-white">Flush:</strong> Any five cards of the same suit.</li>
                <li><strong className="text-white">Straight:</strong> Five cards in a sequence.</li>
                <li><strong className="text-white">Three of a Kind:</strong> Three cards of the same rank.</li>
                <li><strong className="text-white">Two Pair:</strong> Two different pairs.</li>
                <li><strong className="text-white">One Pair:</strong> Two cards of the same rank.</li>
                <li><strong className="text-white">High Card:</strong> Highest card plays if no other hand is made.</li>
              </ol>

              <h3 className="text-xl text-sand-400 mt-6 mb-2 font-heading">Betting Actions</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Fold:</strong> Give up your hand and lose your bets.</li>
                <li><strong className="text-white">Check:</strong> Pass the action to the next player without betting.</li>
                <li><strong className="text-white">Call:</strong> Match the current bet.</li>
                <li><strong className="text-white">Raise:</strong> Increase the current bet.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

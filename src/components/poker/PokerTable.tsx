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
  const [canRaise, setCanRaise] = useState(true);
  const [callAmount, setCallAmount] = useState(0);
  const [customRaise, setCustomRaise] = useState<string>('');
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
    setCanRaise(true);
    setCallAmount(0);
    setCustomRaise('');
    setMessage('The cards are dealt. Your move.');
    setNpcChat('One-Eyed Mossy: "I\'m in. Let\'s see what you got."');
    playSound('deal');
  };

  // --- NPC AI: Decides what each bot does on their turn ---
  const processNpcTurns = (currentNpcs: NPC[], currentCommunity: Card[], currentBet: number, isAllIn = false): {
    updatedNpcs: NPC[];
    potChange: number;
    actions: string[];
    maxBotRaise: number;
  } => {
    let potChange = 0;
    const actions: string[] = [];
    let maxBotRaise = 0;

    const updatedNpcs = currentNpcs.map(npc => {
      if (npc.isFolded) return npc;

      const npcAll = [...npc.hand, ...currentCommunity];
      const handEval = evaluateHand(npcAll);
      const category = handEval.category;
      const mainRank = handEval.mainRank;

      // --- FOLD LOGIC ---
      let foldChance = 0;
      let hasDraw = false;

      // Only consider folding if there is an actual bet to call
      if (currentBet > 0) {
        if (currentCommunity.length > 0) {
          // Check for flush draw
          const suitCounts: Record<string, number> = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
          npcAll.forEach(c => suitCounts[c.suit]++);
          hasDraw = Object.values(suitCounts).some(count => count === 4);
        }

        if (currentCommunity.length === 0) {
          // Pre-flop logic
          const rV: Record<Rank, number> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
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
          const betToPotRatio = currentBet / (pot + 1);
          let baseFold = 0;
          
          if (category === 0) baseFold = 0.6; // High Card
          else if (category === 1 && mainRank < 11) baseFold = 0.3; // Low Pair (2s-10s)
          else if (category === 1 && mainRank >= 11) baseFold = 0.1; // High Pair (Js-As)
          
          // Bots NEVER fold if they have Two Pair or better!
          if (category < 2) {
            if (npc.personality === 'cowardly') foldChance = baseFold + 0.2;
            else if (npc.personality === 'balanced') foldChance = baseFold;
            else foldChance = Math.max(0, baseFold - 0.2); // aggressive

            if (hasDraw) foldChance *= 0.3; // Much less likely to fold with a draw

            // Adjust fold chance based strictly on pot odds (betToPotRatio)
            if (betToPotRatio > 0.8) {
               foldChance += 0.4; // Pot-sized bet or larger scares everyone
               if (category === 1 && mainRank < 11) foldChance += 0.4; // Weak pairs almost always fold to pot-sized bets
            } else if (betToPotRatio > 0.4) {
               foldChance += 0.2; // Half-pot bet
            } else if (betToPotRatio > 0.2) {
               foldChance += 0.05;
            }
          }
        }
      }

      if (foldChance > 0 && Math.random() < foldChance) {
        actions.push(`${npc.name} folds${currentCommunity.length === 0 ? ' pre-flop' : ''}!`);
        return { ...npc, isFolded: true };
      }

      // --- RAISE LOGIC ---
      // Bots cannot raise when the player is all-in (no chips left to call a re-raise)
      let raiseChance = 0;
      let raiseMultiplier = 1;

      if (!isAllIn) {
        if (npc.personality === 'aggressive') {
          if (category >= 2) { raiseChance = 0.80; raiseMultiplier = Math.random() > 0.4 ? 2 : 1; }
          else if (category === 1) raiseChance = 0.40;
          else raiseChance = 0.15; // Bluff raise
        } else if (npc.personality === 'balanced') {
          if (category >= 3) { raiseChance = 0.70; raiseMultiplier = Math.random() > 0.6 ? 1.5 : 1; }
          else if (category >= 2) raiseChance = 0.40;
          else if (category === 1) raiseChance = 0.15;
        } else { // cowardly
          if (category >= 4) raiseChance = 0.50;
          else if (category >= 2) raiseChance = 0.15;
        }
      }

      if (Math.random() < raiseChance) {
        // A raise must exceed the current bet — bot raises by (bet * multiplier) on top of the current bet
        const baseBet = currentBet > 0 ? currentBet : bet;
        const raiseAmt = Math.floor(baseBet + baseBet * raiseMultiplier);
        potChange += raiseAmt;
        if (raiseAmt > maxBotRaise) maxBotRaise = raiseAmt;

        const isBluff = category === 0;
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
      // Say "checks" when there is no bet to call, "calls" otherwise
      actions.push(currentBet > 0 ? `${npc.name} calls.` : `${npc.name} checks.`);
      return npc;
    });

    return { updatedNpcs, potChange, actions, maxBotRaise };
  };

  const handleAction = async (action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', customAmount?: number) => {
    if (action === 'fold') {
      setMessage('You folded. The Saloon takes your ante.');
      await resolveShowdown(false, true);
      return;
    }

    if (action === 'raise' || action === 'all-in') {
      const baseRaise = bet * 2;
      const minRaise = baseRaise + callAmount;
      const raiseAmt = action === 'all-in' ? gold : (customAmount || minRaise);
      
      if (action !== 'all-in' && raiseAmt < minRaise) return alert(`Minimum raise is ${minRaise}!`);
      if (action !== 'all-in' && gold < raiseAmt) return alert('Not enough gold to raise that much!');
      if (action === 'all-in' && gold <= 0) return alert('You have no gold to go all in!');
      
      setGold(prev => prev - raiseAmt);
      setInvested(prev => prev + raiseAmt);
      setCallAmount(0); // Player takes the initiative
      
      // NPC response to player's ALL IN — bots can only call or fold
      const { updatedNpcs, potChange, actions, maxBotRaise } = processNpcTurns(npcs, communityCards, raiseAmt, true);
      const callingNpcs = updatedNpcs.filter(n => !n.isFolded);

      setNpcs(updatedNpcs);
      // Player's raise + each active NPC calling it + any extra bot raise amounts
      setPot(prev => prev + raiseAmt + (raiseAmt * callingNpcs.length) + potChange);
      
      // All-in: no further raises possible, clear callAmount
      if (action === 'all-in') {
        setCallAmount(0);
        setCanRaise(false);
      } else if (maxBotRaise > 0) {
        setCallAmount(maxBotRaise);
      }
      
      if (callingNpcs.length === 0) {
        setMessage('Everyone folded! The pot is yours.');
        await resolveShowdown(true);
        return;
      }

      const foldCount = updatedNpcs.filter(n => n.isFolded).length - npcs.filter(n => n.isFolded).length;
      const raiseCount = actions.filter(a => a.includes('raises')).length;
      
      // If a bot re-raised, the player gets to act again (can raise again)
      setCanRaise(raiseCount > 0);

      let msg = action === 'all-in' ? `You went ALL IN!` : `You raised to ${raiseAmt}!`;
      if (foldCount > 0) msg += ` ${foldCount} folded.`;
      if (raiseCount > 0) msg += ` ${raiseCount} re-raised!`;
      if (foldCount === 0 && raiseCount === 0) msg += ' Everyone calls. (Check/Call to continue)';
      
      setMessage(msg);
      showNpcAction(actions, updatedNpcs);
      return;
    }

    if (action === 'check' || action === 'call') {
      if (callAmount > 0) {
        if (gold < callAmount) return alert("Not enough gold to call! You must fold or go ALL IN.");
        setGold(prev => prev - callAmount);
        setInvested(prev => prev + callAmount);
        setPot(prev => prev + callAmount);
        setCallAmount(0);
      }
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
    setCanRaise(true); // Reset raise ability for the new street
    setCallAmount(0); // Reset outstanding bets for the new street
    setCustomRaise(''); // Clear custom raise input

    // NPC turns after community cards are dealt
    const { updatedNpcs, potChange, actions, maxBotRaise } = processNpcTurns(npcs, nextCommunity, bet);
    setNpcs(updatedNpcs);
    setPot(prev => prev + potChange);
    
    if (maxBotRaise > 0) setCallAmount(prev => prev + maxBotRaise);

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

  const evaluate5CardHand = (cards: Card[]) => {
    const rV: Record<Rank, number> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    const ranks = cards.map(c => rV[c.rank]).sort((a, b) => b - a);
    
    let isFlush = false;
    let isStraight = false;

    if (cards.length >= 5) {
      isFlush = cards.every(c => c.suit === cards[0].suit);
      if (ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5) isStraight = true;
      if (ranks.join(',') === '14,5,4,3,2') { isStraight = true; ranks[0] = 5; ranks[1] = 4; ranks[2] = 3; ranks[3] = 2; ranks[4] = 1; ranks.sort((a,b)=>b-a); }
    }

    const counts: Record<number, number> = {};
    ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const entries = Object.entries(counts).map(([r, c]) => ({ rank: parseInt(r), count: c })).sort((a, b) => b.count - a.count || b.rank - a.rank);

    let category = 0;
    let label = 'High Card';
    
    if (isFlush && isStraight) { category = 8; label = 'Straight Flush'; }
    else if (entries[0].count === 4) { category = 7; label = 'Four of a Kind'; }
    else if (entries[0].count === 3 && entries[1]?.count >= 2) { category = 6; label = 'Full House'; }
    else if (isFlush) { category = 5; label = 'Flush'; }
    else if (isStraight) { category = 4; label = 'Straight'; }
    else if (entries[0].count === 3) { category = 3; label = 'Three of a Kind'; }
    else if (entries[0].count === 2 && entries[1]?.count === 2) { category = 2; label = 'Two Pair'; }
    else if (entries[0].count === 2) { category = 1; label = 'One Pair'; }

    const orderedRanks: number[] = [];
    entries.forEach(e => { for(let i=0; i<e.count; i++) orderedRanks.push(e.rank); });
    while (orderedRanks.length < 5) orderedRanks.push(0);

    const score = category * 10000000000 + 
                  orderedRanks[0] * 100000000 + 
                  orderedRanks[1] * 1000000 + 
                  orderedRanks[2] * 10000 + 
                  orderedRanks[3] * 100 + 
                  orderedRanks[4];

    return { score, label, category, mainRank: orderedRanks[0] };
  };

  const getCombinations = (array: Card[], size: number): Card[][] => {
    if (array.length <= size) return [array];
    const result: Card[][] = [];
    const f = (prefix: Card[], arr: Card[]) => {
      if (prefix.length === size) {
        result.push(prefix);
        return;
      }
      for (let i = 0; i < arr.length; i++) {
        f([...prefix, arr[i]], arr.slice(i + 1));
      }
    };
    f([], array);
    return result;
  };

  const evaluateHand = (handCards: Card[]) => {
    if (handCards.length === 0) return { score: 0, label: 'Evaluating...', category: 0, mainRank: 0 };
    const combos = getCombinations(handCards, 5);
    let bestHand = { score: -1, label: '', category: 0, mainRank: 0 };
    for (const combo of combos) {
      const result = evaluate5CardHand(combo);
      if (result.score > bestHand.score) bestHand = result;
    }
    return bestHand;
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
               <div className="flex gap-2">
                  {npc.hand.map((c, i) => (
                    <div key={i} style={{ animationDelay: `${i * 150}ms` }} className={`w-10 h-14 bg-white border-2 border-rust-900 rounded flex items-center justify-center text-lg font-bold animate-deal ${npc.isFolded ? 'opacity-50' : 'text-rust-900'}`}>
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
          {[...Array(5)].map((_, i) => {
            const card = communityCards[i];
            // Key on card content so animation only fires when a new card appears, not on every render
            const cardKey = card ? `${card.rank}${card.suit}` : `empty-${i}`;
            return (
              <div key={cardKey} style={{ animationDelay: `${i * 150}ms` }} className={`w-28 h-40 rounded-xl border-4 flex items-center justify-center text-3xl font-bold transition-all shadow-2xl ${card ? 'bg-white text-rust-900 border-sand-200 animate-deal-community scale-105' : 'bg-rust-900/30 border-rust-900 border-dashed scale-95 opacity-20'}`}>
                {card ? (
                  <>{card.rank}<span className={getSuitColor(card.suit)}>{card.suit}</span></>
                ) : ''}
              </div>
            );
          })}
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
                // Key on card content so the deal animation only fires when cards are first dealt
                <div key={`${card.rank}${card.suit}`} style={{ animationDelay: `${i * 200}ms` }} className="w-24 h-36 bg-white border-4 border-rust-900 rounded-xl flex items-center justify-center text-3xl font-bold text-rust-900 animate-deal shadow-2xl hover:scale-110 transition-transform">
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
                <div className="flex gap-4 w-full items-center justify-between">
                   <span className="text-sand-500 font-bold uppercase tracking-widest text-lg">Custom Bet:</span>
                   <input 
                     type="number" 
                     value={bet}
                     onChange={(e) => {
                       const maxAnte = Math.max(10, Math.floor(gold / 4));
                       const val = parseInt(e.target.value) || 10;
                       setBet(Math.min(maxAnte, Math.max(10, val)));
                     }}
                     className="bg-rust-950 border-4 border-sand-400 text-white text-center font-pixel text-3xl py-2 w-1/2"
                   />
                </div>
                <button onClick={startRound} className="btn-pixel w-full py-8 text-3xl tracking-[0.4em] font-heading">TAKE A SEAT</button>
             </div>
           ) : phase === 'result' ? (
             <button onClick={() => { setPhase('betting'); setHand([]); setCommunity([]); setMessage('Want to go again?'); setNpcChat(''); setInvested(0); }} className="btn-pixel w-full py-10 text-3xl tracking-[0.3em] font-heading">PLAY ANOTHER ROUND</button>
           ) : (
             <div className="grid grid-cols-2 gap-6 w-full">
                <button onClick={() => handleAction('fold')} className="btn-pixel bg-rust-800 border-rust-950 text-sand-600 text-sm py-6">FOLD</button>
                <button onClick={() => handleAction(callAmount > 0 ? 'call' : 'check')} className={`btn-pixel bg-sand-400 text-rust-900 border-sand-600 text-sm py-6 uppercase tracking-widest ${!canRaise ? 'col-span-2' : ''}`}>
                   {phase === 'showdown' ? 'SHOWDOWN' : (callAmount > 0 ? `CALL (💰 ${callAmount})` : 'CHECK')}
                </button>
                {canRaise && phase !== 'showdown' && (
                  <div className="col-span-2 grid grid-cols-3 gap-6">
                    <input 
                      type="number" 
                      placeholder={`Min: ${bet * 2 + callAmount}`}
                      min={bet * 2 + callAmount}
                      max={gold}
                      value={customRaise}
                      onChange={(e) => setCustomRaise(e.target.value)}
                      className="bg-rust-950 border-4 border-terracotta-600 text-white text-center font-pixel text-3xl placeholder:text-rust-800 placeholder:text-xl"
                    />
                    <button 
                      onClick={() => handleAction('raise', customRaise ? parseInt(customRaise) : undefined)} 
                      className="btn-pixel bg-terracotta-400 text-rust-900 border-terracotta-600 text-sm py-6 uppercase tracking-[0.2em] font-bold"
                    >
                      RAISE
                    </button>
                    <button onClick={() => handleAction('all-in')} className="btn-pixel bg-red-700 text-white border-red-900 text-sm py-6 uppercase tracking-[0.2em] font-bold hover:bg-red-600">ALL IN</button>
                  </div>
                )}
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

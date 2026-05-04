'use client';

import { useState, useEffect } from 'react';
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
import { useGold } from '@/context/GoldContext';

const INITIAL_NPCS: NPC[] = [
  { name: 'One-Eyed Mossy', avatar: '/avatars/pete.png', personality: 'aggressive', hand: [], isFolded: false, phrase: 'I seen better hands in a graveyard!' },
  { name: 'Feller Epilex', avatar: '/avatars/rusty.png', personality: 'cowardly', hand: [], isFolded: false, phrase: 'I got a bad feeling about this...' },
  { name: 'AI Silas', avatar: '/avatars/silas.png', personality: 'balanced', hand: [], isFolded: false, phrase: 'Probabilities are... interesting.' }
];

export default function PokerTable({ initialGold, defaultBet = 10 }: { initialGold: number; defaultBet?: number }) {
  const [gold, setGold] = useState(initialGold);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setHand] = useState<Card[]>([]);
  const [communityCards, setCommunity] = useState<Card[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [phase, setPhase] = useState<'betting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'result'>('betting');
  const [pot, setPot] = useState(0);
  const [bet, setBet] = useState(defaultBet);
  const [invested, setInvested] = useState(0);
  const [message, setMessage] = useState('Step up to the table, partner.');
  const [npcChat, setNpcChat] = useState<string>('');
  const [honorCue, setHonorCue] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [canRaise, setCanRaise] = useState(true);
  const [callAmount, setCallAmount] = useState(0);
  const [customRaise, setCustomRaise] = useState<string>('');
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [dealerChat, setDealerChat] = useState('Welcome to the Saloon, partner. Place yer bets.');
  const { playSound } = useSound();
  const { setDisplayGold } = useGold();

  // Sync local gold to the Navbar counter in real time
  useEffect(() => {
    setDisplayGold(gold);
  }, [gold, setDisplayGold]);

  const DEALER_DEAL = [
    'Cards are dealt, partner. May the best hand win.',
    'Freshly shuffled. Let the chaos begin.',
    'Eyes on your cards, hands off mine.',
    'I once dealt to a rattlesnake. It bluffed better than most.',
    'The cards are out. What happens next is on you.',
    'Deal done. Now try not to sweat through yer hat.',
  ];
  const DEALER_FLOP = [
    'The Flop! Three cards speak louder than words.',
    'Flop is out. I\'ve seen men cry at worse.',
    'Here comes the flop, partner. Hold yer horses.',
    'Three cards on the felt. The table holds its breath.',
  ];
  const DEALER_TURN = [
    'The Turn. Things are gettin\' real interesting.',
    'Fourth card down. Sweat all you want, I\'ve seen worse.',
    'The Turn card speaks. Are you listening?',
    'One more card changes everything out here, friend.',
  ];
  const DEALER_RIVER = [
    'The River. Last card. Destiny or disaster.',
    'River\'s out. Make peace with whatever you\'re holding.',
    'Final card, cowboy. This is the frontier — anything goes.',
    'The river runs dry. Time to face the music.',
  ];
  const DEALER_WIN = [
    'Hoo-wee! We got ourselves a winner!',
    'That\'s the stuff legends are made of, right there.',
    'Nobody saw that comin\'. Except maybe the cards.',
    'Winner winner, saloon dinner!',
  ];
  const DEALER_LOSE = [
    'Tough luck, friend. The frontier is unforgiving.',
    'Better luck next hand, partner.',
    'Even the best cowboys lose one now and then.',
    'The house doesn\'t always win... but today it did.',
  ];
  const DEALER_FOLD = [
    'Fold accepted. No shame in livin\' to fight another day.',
    'You folded faster than a wet saddle blanket.',
    'Discretion is the better part of valor, they say.',
  ];
  const DEALER_ALLIN = [
    'ALL IN! Hearts are poundin\' across the Saloon!',
    'Everything on the table! This is what poker\'s about!',
    'The whole stack! Somebody\'s leavin\' rich or broke tonight!',
  ];
  const DEALER_SHOWDOWN = [
    'Showdown! Let\'s see what everyone\'s been hidin\'.',
    'Cards face up, partner. The truth always comes out.',
    'The moment of reckoning. Show \'em what you got.',
  ];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

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
    setHandsPlayed(prev => prev + 1);
    setDealerChat(pick(DEALER_DEAL));
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
      setDealerChat(pick(DEALER_FOLD));
      await resolveShowdown(false, true);
      return;
    }

    if (action === 'raise' || action === 'all-in') {
      const baseRaise = bet * 2;
      const minRaise = baseRaise + callAmount;
      const raiseAmt = action === 'all-in' ? gold : (customAmount || minRaise);

      if (action === 'all-in') setDealerChat(pick(DEALER_ALLIN));
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
        // Cap at what the player can actually afford after this raise
        const remaining = gold - raiseAmt;
        setCallAmount(Math.min(maxBotRaise, Math.max(0, remaining)));
      }

      if (callingNpcs.length === 0) {
        setMessage('Everyone folded! The pot is yours.');
        await resolveShowdown(true);
        return;
      }

      const foldCount = updatedNpcs.filter(n => n.isFolded).length - npcs.filter(n => n.isFolded).length;
      const raiseCount = actions.filter(a => a.includes('raises')).length;

      // If a bot re-raised, the player gets to act again (can raise again)
      // IMPORTANT: Don't overwrite canRaise=false that was set by all-in logic above
      if (action !== 'all-in') {
        setCanRaise(raiseCount > 0);
      }

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
      setDealerChat(pick(DEALER_SHOWDOWN));
      await resolveShowdown();
      setDeck(newDeck);
      return;
    }
    setDeck(newDeck);
    setCanRaise(true); // Reset raise ability for the new street
    setCallAmount(0); // Reset outstanding bets for the new street
    setCustomRaise(''); // Clear custom raise input

    // NPC turns after community cards are dealt — currentBet is 0 because the player checked/called
    // Bots can spontaneously raise on a new street (betting into player)
    const { updatedNpcs, potChange, actions, maxBotRaise } = processNpcTurns(npcs, nextCommunity, 0);
    setNpcs(updatedNpcs);
    setPot(prev => prev + potChange);

    // Replace (not accumulate) the call amount from this street's bot raises
    // Cap at remaining gold so bots can't demand more than the player has
    const remainingGold = gold - (callAmount > 0 ? callAmount : 0);
    if (maxBotRaise > 0) setCallAmount(Math.min(maxBotRaise, remainingGold)); else setCallAmount(0);

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
    if (nextCommunity.length === 3) { phaseMsg = 'The flop is dealt.'; setDealerChat(pick(DEALER_FLOP)); }
    else if (nextCommunity.length === 4) { phaseMsg = 'The turn is out.'; setDealerChat(pick(DEALER_TURN)); }
    else if (nextCommunity.length === 5) { phaseMsg = 'The river has run dry.'; setDealerChat(pick(DEALER_RIVER)); }

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
          'Fine! I fold. But I\'ll be back to fuck your wife.',
          'This hand ain\'t worth my spit. Fold.',
          'Imma fold for now, but next time I\'m gonna fuck you, your wife, your mule, and your cousin!'
        ],
        'cowardly': [
          'Nope. Nope nope nope. I\'m fucking OUT.',
          'I fold! I can\'t take the pressure!',
          'My mule needs me alive. I fold.',
          'I knew I shoulda beat my wife today.',
          'My asshole can only take so much abuse.',
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
      'I seen better hands in a whorehouse!',
      'Raise it up, pussy!',
      'Don\'t blink, kid. I can smell your horseshit.',
      'My johnson plays better poker than you.',
      'Are you gonna bet or just sit there lookin\' pretty?',
      'I once bluffed a sheriff outta his badge.',
      'You call that a raise? My retard grandson bets harder.',
      'Keep pushin\'. I like it when they push.',
      'You\'re sweating, asshole. I can tell from here.',
    ];
    if (npc.personality === 'cowardly') reactions = [
      'I got a bad feeling about this...',
      'The desert sun is getting to ya.',
      'Is it hot in here? I\'m sweatin\' bullets.',
      'I\'m just here for the sarsaparilla.',
      'Please don\'t take all my gold, How will I pay for the whores?.',
      'Fold? Me? No, just... resting my eyes.',
      'I had a dream about losing last night. And here we are.',
      'My hands are fine. They\'re just jacking the dealer off.',
      'Maybe I should\'ve stayed at the ranch...',
      'Is this hand good? I genuinely can\'t tell anymore.',
    ];
    if (npc.personality === 'balanced') reactions = [
      'Interesting move... statistically unwise, but interesting.',
      'Probabilities suggest you are bluffing 87.3% of the time.',
      'Show me the next one. My electronic penis is ready.',
      'Fair enough. I have calculated all outcomes.',
      'Your heart rate elevated when you checked. Fascinating.',
      'Processing bet... Acceptable risk parameter.',
      'My model predicts a 64% chance you regret that.',
      'Curious. An illogical play with a logical outcome.',
      'I\'ve simulated this hand 4,000 times. Results vary.',
      'Emotion detected in your betting pattern. Adjusting strategy.',
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
        setDealerChat(pick(DEALER_WIN));
        playSound('win');
        incrementHonor(10);
        setHonorCue('+10 HONOR');
        setTimeout(() => setHonorCue(null), 3000);
      } else {
        setMessage(`LOSE. ${winningNpc?.name} won with a ${winningNpc?.rank.label}.`);
        setDealerChat(pick(DEALER_LOSE));
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
      if (ranks.join(',') === '14,5,4,3,2') { isStraight = true; ranks[0] = 5; ranks[1] = 4; ranks[2] = 3; ranks[3] = 2; ranks[4] = 1; ranks.sort((a, b) => b - a); }
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
    entries.forEach(e => { for (let i = 0; i < e.count; i++) orderedRanks.push(e.rank); });
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
    <div className="max-w-7xl mx-auto py-4 px-2 font-pixel space-y-4">

      {/* TOP BAR: Pot + Commentary + Gold */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        <div className="panel-pixel bg-rust-950/80 border-sand-500/40 shadow-none flex items-center gap-3 py-2 px-4 shrink-0">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-sm uppercase tracking-widest text-sand-600">Pot</p>
            <p className="text-2xl font-heading text-sand-200">{pot}</p>
          </div>
        </div>
        <div className="flex-1 panel-pixel bg-rust-950/50 border-sand-500/20 shadow-none py-2 px-4 flex items-center justify-center">
          <p className="text-xl font-heading text-terracotta-400 tracking-widest animate-pulse text-center">{message}</p>
        </div>
        <div className="panel-pixel bg-rust-950/80 border-sand-500/40 shadow-none flex items-center gap-3 py-2 px-4 shrink-0">
          <span className="text-2xl">🏅</span>
          <div>
            <p className="text-sm uppercase tracking-widest text-sand-600">Your Gold</p>
            <p className="text-2xl font-heading text-sand-200">{gold}</p>
          </div>
        </div>
      </div>

      {/* MAIN GRID: Dealer | Center | Stats */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '200px 1fr 200px' }}>

        {/* LEFT: Dealer */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 bg-rust-950 border-4 border-terracotta-400 relative overflow-hidden shadow-xl">
            <Image src="/avatars/dealer.png" alt="Dealer" fill className="pixelated object-cover" unoptimized />
          </div>
          <div className="bg-rust-900 text-sand-400 px-2 py-1 text-sm font-bold uppercase tracking-widest border-2 border-rust-950">Dealer</div>
          <div className="panel-pixel bg-sand-400 border-sand-600 shadow-none text-rust-900 text-sm italic text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[9px] border-b-sand-400"></div>
            &quot;{dealerChat}&quot;
          </div>
          <div className="w-full mt-2 space-y-1">
            {(['preflop', 'flop', 'turn', 'river', 'showdown'] as const).map(p => (
              <div key={p} className={`text-sm uppercase tracking-widest py-1 text-center border ${phase === p ? 'border-terracotta-400 text-terracotta-400' : 'border-rust-800 text-rust-800'}`}>{p}</div>
            ))}
          </div>
        </div>

        {/* CENTER */}
        <div className="space-y-3">
          {/* NPC Row */}
          <div className="grid grid-cols-3 gap-2">
            {npcs.map(npc => (
              <div key={npc.name} className="flex flex-col items-center space-y-1">
                <div className={`w-14 h-14 bg-rust-950 border-4 relative overflow-hidden shadow-lg ${npc.isFolded ? 'opacity-30 grayscale border-rust-900' : 'border-sand-400'}`}>
                  <Image src={npc.avatar} alt={npc.name} fill className="pixelated object-cover" unoptimized />
                </div>
                <div className="bg-rust-900 text-sand-400 px-1 py-1 text-sm font-bold uppercase tracking-wider border border-rust-950 text-center w-full truncate">{npc.name}</div>
                {phase === 'result' && (
                  <div className="flex gap-1">
                    {npc.hand.map((c, i) => (
                      <div key={i} style={{ animationDelay: `${i * 150}ms` }} className={`w-7 h-10 bg-white border-2 border-rust-900 rounded flex items-center justify-center text-xs font-bold animate-deal ${npc.isFolded ? 'opacity-50' : 'text-rust-900'}`}>
                        {c.rank}<span className={getSuitColor(c.suit)}>{c.suit}</span>
                      </div>
                    ))}
                  </div>
                )}
                {npcChat.startsWith(npc.name) && (
                  <div className="panel-pixel py-2 px-2 bg-white text-rust-900 text-sm italic shadow-none border-2 border-rust-900 relative text-center break-words overflow-hidden w-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] border-b-rust-900"></div>
                    &quot;{npcChat.split(': "')[1]?.replace('"', '')}&quot;
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Green Felt */}
          <div className="panel-pixel bg-green-950/70 border-sand-400 flex flex-col items-center py-6 gap-4 shadow-[0_0_60px_rgba(0,0,0,0.7)_inset]">
            <div className="flex gap-3 flex-wrap justify-center">
              {[...Array(5)].map((_, i) => {
                const card = communityCards[i];
                const cardKey = card ? `${card.rank}${card.suit}` : `empty-${i}`;
                return (
                  <div key={cardKey} style={{ animationDelay: `${i * 150}ms` }} className={`w-16 h-24 rounded-lg border-4 flex items-center justify-center text-xl font-bold transition-all shadow-lg ${card ? 'bg-white text-rust-900 border-sand-200 animate-deal-community' : 'bg-rust-900/30 border-rust-900 border-dashed opacity-20'}`}>
                    {card ? <>{card.rank}<span className={getSuitColor(card.suit)}>{card.suit}</span></> : ''}
                  </div>
                );
              })}
            </div>
            {honorCue && (
              <div className="text-3xl font-heading text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,1)] animate-bounce">{honorCue}</div>
            )}
          </div>

          {/* Player hand + Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="panel-pixel bg-rust-950/90 border-sand-400 shadow-none text-center space-y-2 shrink-0">
              <p className="text-sm uppercase text-sand-500 font-bold tracking-widest">Your Hand</p>
              <div className="flex gap-2 justify-center">
                {playerHand.map((card, i) => (
                  <div key={`${card.rank}${card.suit}`} style={{ animationDelay: `${i * 200}ms` }} className="w-14 h-20 bg-white border-4 border-rust-900 rounded-lg flex items-center justify-center text-xl font-bold text-rust-900 animate-deal shadow-lg hover:scale-110 transition-transform">
                    {card.rank}<span className={getSuitColor(card.suit)}>{card.suit}</span>
                  </div>
                ))}
                {playerHand.length === 0 && <div className="w-32 h-20 border-4 border-rust-900 border-dashed rounded-lg opacity-10"></div>}
              </div>
            </div>

            <div className="flex-1 w-full">
              {phase === 'betting' ? (
                <div className="panel-pixel space-y-3 bg-rust-900/50 flex flex-col items-center">
                  <div className="flex justify-between items-center w-full text-base uppercase font-bold text-sand-500 tracking-widest">
                    <span>Ante</span><span className="text-sand-200 text-2xl">💰 {bet}</span>
                  </div>
                  <div className="flex gap-2 w-full">
                    {[10, 25, 50, 100].map(val => {
                      const maxAnte = Math.max(10, Math.floor(gold / 4));
                      return (
                        <button key={val} onClick={() => setBet(Math.min(val, maxAnte))} disabled={gold < val}
                          className={`btn-pixel flex-1 py-2 px-0 disabled:opacity-30 text-base ${bet === Math.min(val, maxAnte) && gold >= val ? 'bg-sand-400 text-rust-950' : 'bg-rust-800'}`}>{val}</button>
                      );
                    })}
                  </div>
                  {handsPlayed > 0 && (
                    <div className="flex gap-2 w-full items-center">
                      <span className="text-sand-500 font-bold uppercase tracking-widest text-sm shrink-0">Custom:</span>
                      <input type="number" value={bet}
                        onChange={(e) => { const m = Math.max(10, Math.floor(gold / 4)); setBet(Math.min(m, Math.max(10, parseInt(e.target.value) || 10))); }}
                        className="bg-rust-950 border-4 border-sand-400 text-white text-center font-pixel text-xl py-1 flex-1" />
                    </div>
                  )}
                  <button onClick={startRound} className="btn-pixel w-full py-3 text-lg tracking-[0.3em] font-heading">TAKE A SEAT</button>
                </div>
              ) : phase === 'result' ? (
                <button onClick={() => { setPhase('betting'); setHand([]); setCommunity([]); setMessage('Want to go again?'); setNpcChat(''); setInvested(0); setPot(0); setCanRaise(true); setCallAmount(0); setCustomRaise(''); setBet(prev => Math.min(prev, Math.max(10, Math.floor(gold / 4)))); }}
                  className="btn-pixel w-full py-3 text-lg tracking-[0.2em] font-heading">PLAY ANOTHER ROUND</button>
              ) : (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button onClick={() => handleAction('fold')} className="btn-pixel bg-rust-800 border-rust-950 text-sand-600 py-3">FOLD</button>
                  <button onClick={() => handleAction(callAmount > 0 ? 'call' : 'check')}
                    className={`btn-pixel bg-sand-400 text-rust-900 border-sand-600 py-3 uppercase tracking-widest ${!canRaise ? 'col-span-2' : ''}`}>
                    {phase === 'showdown' ? 'SHOWDOWN' : (callAmount > 0 ? `CALL 💰${callAmount}` : 'CHECK')}
                  </button>
                  {canRaise && phase !== 'showdown' && (
                    <div className="col-span-2 grid grid-cols-3 gap-2">
                      <input type="number" placeholder={`Min:${bet * 2 + callAmount}`} min={bet * 2 + callAmount} max={gold}
                        value={customRaise} onChange={(e) => setCustomRaise(e.target.value)}
                        className="bg-rust-950 border-4 border-terracotta-600 text-white text-center font-pixel text-lg placeholder:text-rust-700 placeholder:text-xs py-2" />
                      <button onClick={() => handleAction('raise', customRaise ? parseInt(customRaise) : undefined)}
                        className="btn-pixel bg-terracotta-400 text-rust-900 border-terracotta-600 py-3 uppercase font-bold">RAISE</button>
                      <button onClick={() => handleAction('all-in')}
                        className="btn-pixel bg-red-700 text-white border-red-900 py-3 uppercase font-bold hover:bg-red-600">ALL IN</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Stats */}
        <div className="flex flex-col gap-3">
          <div className="panel-pixel bg-rust-950/80 border-sand-500/40 shadow-none space-y-2">
            <p className="text-sm uppercase tracking-widest text-sand-500 font-bold border-b border-rust-800 pb-1">Stats</p>
            <div className="flex justify-between text-sm"><span className="text-sand-600">Hands</span><span className="text-sand-200 font-bold">{handsPlayed}</span></div>
            <div className="flex justify-between text-sm"><span className="text-sand-600">Invested</span><span className="text-sand-200 font-bold">💰{invested}</span></div>
            <div className="flex justify-between text-sm"><span className="text-sand-600">Alive</span><span className="text-sand-200 font-bold">{npcs.filter(n => !n.isFolded).length}/3</span></div>
            {callAmount > 0 && <div className="text-terracotta-400 text-sm uppercase text-center animate-pulse border border-terracotta-600 py-1 font-bold">Call: 💰{callAmount}</div>}
          </div>
          <div className="panel-pixel bg-rust-950/80 border-sand-500/40 shadow-none space-y-1">
            <p className="text-sm uppercase tracking-widest text-sand-500 font-bold border-b border-rust-800 pb-1 mb-1">Hands</p>
            {['Str. Flush', 'Four Kind', 'Full House', 'Flush', 'Straight', 'Three Kind', 'Two Pair', 'One Pair', 'High Card'].map(h => (
              <p key={h} className="text-sm text-sand-500 leading-tight">{h}</p>
            ))}
          </div>
          <button onClick={() => setShowRules(true)} className="btn-pixel bg-sand-400 text-rust-900 w-full py-2 text-sm">📖 RULES</button>
        </div>

      </div>

      {showRules && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="panel-pixel bg-rust-950 border-sand-400 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative p-8">
            <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 text-sand-500 hover:text-white text-2xl font-bold">×</button>
            <h2 className="text-3xl font-heading text-terracotta-400 mb-6 tracking-widest text-center">Poker Rules</h2>
            <div className="space-y-4 text-sand-200 text-base leading-relaxed">
              <p>Welcome to El Rancho Texas Hold&apos;em!</p>
              <h3 className="text-xl text-sand-400 mt-4 mb-2 font-heading">Basics</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>2 private hole cards dealt to you.</li>
                <li>5 community cards on the table.</li>
                <li>Best 5-card hand wins.</li>
              </ul>
              <h3 className="text-xl text-sand-400 mt-4 mb-2 font-heading">Hand Rankings</h3>
              <ol className="list-decimal pl-6 space-y-1">
                <li><strong className="text-white">Straight Flush</strong></li>
                <li><strong className="text-white">Four of a Kind</strong></li>
                <li><strong className="text-white">Full House</strong></li>
                <li><strong className="text-white">Flush</strong></li>
                <li><strong className="text-white">Straight</strong></li>
                <li><strong className="text-white">Three of a Kind</strong></li>
                <li><strong className="text-white">Two Pair</strong></li>
                <li><strong className="text-white">One Pair</strong></li>
                <li><strong className="text-white">High Card</strong></li>
              </ol>
              <h3 className="text-xl text-sand-400 mt-4 mb-2 font-heading">Actions</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong className="text-white">Fold</strong> – Give up your hand</li>
                <li><strong className="text-white">Check</strong> – Pass without betting</li>
                <li><strong className="text-white">Call</strong> – Match the current bet</li>
                <li><strong className="text-white">Raise</strong> – Increase the bet</li>
                <li><strong className="text-white">All In</strong> – Bet everything</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

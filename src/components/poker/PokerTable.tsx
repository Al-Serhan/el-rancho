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

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export default function PokerTable({ initialGold }: { initialGold: number }) {
  const [gold, setGold] = useState(initialGold);
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [heldIndices, setHeldIndices] = useState<number[]>([]);
  const [phase, setPhase] = useState<'betting' | 'draw' | 'result'>('betting');
  const [bet, setBet] = useState(10);
  const [resultMessage, setResultMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize deck
  const createDeck = () => {
    const newDeck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        newDeck.push({ suit, rank });
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const dealInitialHand = () => {
    if (gold < bet) {
      alert('Not enough gold!');
      return;
    }
    const newDeck = createDeck();
    const newHand = newDeck.splice(0, 5);
    setDeck(newDeck);
    setHand(newHand);
    setHeldIndices([]);
    setPhase('draw');
    setResultMessage('');
  };

  const toggleHold = (index: number) => {
    if (phase !== 'draw') return;
    setHeldIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const drawCards = async () => {
    setLoading(true);
    const newHand = [...hand];
    const newDeck = [...deck];
    
    for (let i = 0; i < 5; i++) {
      if (!heldIndices.includes(i)) {
        newHand[i] = newDeck.shift()!;
      }
    }

    setHand(newHand);
    setDeck(newDeck);
    
    const { message, multiplier } = evaluateHand(newHand);
    setResultMessage(message);

    try {
      const result = await resolvePokerGame(bet, multiplier);
      setGold(result.newBalance);
      setPhase('result');
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
      setPhase('betting');
    } finally {
      setLoading(false);
    }
  };

  const evaluateHand = (hand: Card[]) => {
    const counts: Record<string, number> = {};
    const suitCounts: Record<string, number> = {};
    const values = hand.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);

    hand.forEach(c => {
      counts[c.rank] = (counts[c.rank] || 0) + 1;
      suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    });

    const isFlush = Object.values(suitCounts).some(v => v === 5);
    const isStraight = values.every((v, i) => i === 0 || v === values[i - 1] + 1) || 
                       (values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5 && values[4] === 14);

    const freq = Object.values(counts).sort((a, b) => b - a);

    if (isFlush && isStraight && values[4] === 14 && values[0] === 10) return { message: 'ROYAL FLUSH!', multiplier: 250 };
    if (isFlush && isStraight) return { message: 'STRAIGHT FLUSH!', multiplier: 50 };
    if (freq[0] === 4) return { message: 'FOUR OF A KIND!', multiplier: 25 };
    if (freq[0] === 3 && freq[1] === 2) return { message: 'FULL HOUSE!', multiplier: 9 };
    if (isFlush) return { message: 'FLUSH!', multiplier: 6 };
    if (isStraight) return { message: 'STRAIGHT!', multiplier: 4 };
    if (freq[0] === 3) return { message: 'THREE OF A KIND!', multiplier: 3 };
    if (freq[0] === 2 && freq[1] === 2) return { message: 'TWO PAIR!', multiplier: 2 };
    
    // Jacks or Better
    const hasJacksOrBetter = Object.entries(counts).some(([rank, count]) => 
      count === 2 && RANK_VALUES[rank as Rank] >= 11
    );
    if (hasJacksOrBetter) return { message: 'JACKS OR BETTER!', multiplier: 1 };

    return { message: 'BUST!', multiplier: 0 };
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center panel-pixel border-terracotta-400">
        <div className="text-xl">💰 Gold: <span className="text-sand-300">{gold}</span></div>
        <div className="text-xl">🎲 Bet: <span className="text-terracotta-400">{bet}</span></div>
      </div>

      <div className="panel-pixel bg-green-900/20 border-sand-400 min-h-[300px] flex flex-col items-center justify-center space-y-8">
        {hand.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4">
            {hand.map((card, i) => (
              <div 
                key={i} 
                onClick={() => toggleHold(i)}
                className={`
                  w-24 h-36 bg-white rounded-lg flex flex-col items-center justify-center border-4 relative cursor-pointer transition-transform
                  ${heldIndices.includes(i) ? 'border-terracotta-400 -translate-y-4 shadow-[0_0_15px_rgba(226,114,91,0.5)]' : 'border-rust-900 hover:-translate-y-2'}
                `}
              >
                <span className={`text-2xl font-bold ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>
                  {card.rank}{card.suit}
                </span>
                {heldIndices.includes(i) && (
                  <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-terracotta-400 font-heading bg-rust-900 border border-terracotta-400 py-1">
                    HELD
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sand-500 font-heading opacity-50 text-center">
            Place your bet and click Deal to start<br/>
            <span className="text-4xl mt-4 block">🃏🃏🃏🃏🃏</span>
          </div>
        )}

        {resultMessage && (
          <div className="text-3xl font-heading text-terracotta-400 animate-bounce">
            {resultMessage}
          </div>
        )}
      </div>

      <div className="panel-pixel space-y-6">
        {phase === 'betting' && (
          <div className="space-y-4">
            <h3 className="text-sm uppercase text-center text-sand-500">Select Bet Amount</h3>
            <div className="flex justify-center gap-4">
              {[5, 10, 25, 50, 100].map(amount => (
                <button 
                  key={amount}
                  onClick={() => setBet(amount)}
                  className={`btn-pixel text-xs py-2 px-4 ${bet === amount ? 'bg-sand-400 text-rust-900 border-sand-600' : ''}`}
                >
                  {amount}
                </button>
              ))}
            </div>
            <button 
              onClick={dealInitialHand} 
              className="btn-pixel w-full py-4 text-xl"
            >
              DEAL CARDS
            </button>
          </div>
        )}

        {phase === 'draw' && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-sand-500 uppercase">Click cards to Hold them, then Draw</p>
            <button 
              onClick={drawCards} 
              disabled={loading}
              className="btn-pixel w-full py-4 text-xl disabled:opacity-50"
            >
              {loading ? 'WAITING...' : 'DRAW CARDS'}
            </button>
          </div>
        )}

        {phase === 'result' && (
          <button 
            onClick={() => { setPhase('betting'); setHand([]); setHeldIndices([]); setResultMessage(''); }} 
            className="btn-pixel w-full py-4 text-xl"
          >
            PLAY AGAIN
          </button>
        )}
      </div>

      <div className="panel-pixel text-[10px] space-y-2 leading-tight opacity-75">
        <h4 className="font-heading text-sand-500">PAYTABLE</h4>
        <div className="grid grid-cols-2 gap-x-8">
          <div className="flex justify-between border-b border-rust-900 pb-1"><span>Royal Flush</span> <span className="text-terracotta-400">250x</span></div>
          <div className="flex justify-between border-b border-rust-900 pb-1"><span>Straight Flush</span> <span className="text-terracotta-400">50x</span></div>
          <div className="flex justify-between border-b border-rust-900 pb-1"><span>Four of a Kind</span> <span className="text-terracotta-400">25x</span></div>
          <div className="flex justify-between border-b border-rust-900 pb-1"><span>Full House</span> <span className="text-terracotta-400">9x</span></div>
          <div className="flex justify-between border-b border-rust-900 pb-1"><span>Flush</span> <span className="text-terracotta-400">6x</span></div>
          <div className="flex justify-between border-b border-rust-900 pb-1"><span>Straight</span> <span className="text-terracotta-400">4x</span></div>
          <div className="flex justify-between border-b border-rust-900 pb-1"><span>Three of a Kind</span> <span className="text-terracotta-400">3x</span></div>
          <div className="flex justify-between border-b border-rust-900 pb-1"><span>Two Pair</span> <span className="text-terracotta-400">2x</span></div>
          <div className="flex justify-between border-b border-rust-900 pb-1"><span>Jacks or Better</span> <span className="text-terracotta-400">1x</span></div>
        </div>
      </div>
    </div>
  );
}

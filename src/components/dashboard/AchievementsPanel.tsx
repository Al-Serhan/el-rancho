interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  tier?: 'bronze' | 'silver' | 'gold';
}

interface AchievementsPanelProps {
  honor: number;
  gold: number;
  inventoryCount: number;
  tradeCount: number;
}

export default function AchievementsPanel({ honor, gold, inventoryCount, tradeCount }: AchievementsPanelProps) {
  const achievements: Achievement[] = [
    { id: 'first_draw',  name: 'First Draw',    desc: 'Claim your first card',          icon: '🃏', unlocked: inventoryCount >= 1,  tier: 'bronze' },
    { id: 'collector',   name: 'Collector',      desc: 'Own 10 cards',                   icon: '📦', unlocked: inventoryCount >= 10, tier: 'silver' },
    { id: 'hoarder',     name: 'The Hoarder',    desc: 'Own 25 cards',                   icon: '🏦', unlocked: inventoryCount >= 25, tier: 'gold'   },
    { id: 'deal_maker',  name: 'Deal Maker',     desc: 'Complete your first trade',      icon: '🤝', unlocked: tradeCount >= 1,      tier: 'bronze' },
    { id: 'trade_baron', name: 'Trade Baron',    desc: 'Complete 5 trades',              icon: '📜', unlocked: tradeCount >= 5,      tier: 'gold'   },
    { id: 'honorable',   name: 'Honorable',      desc: 'Reach 40 honor',                 icon: '⚖️', unlocked: honor >= 40,          tier: 'silver' },
    { id: 'legend',      name: 'Living Legend',  desc: 'Reach 100 honor',                icon: '⭐', unlocked: honor >= 100,         tier: 'gold'   },
    { id: 'prospector',  name: 'Prospector',     desc: 'Accumulate 500 gold',            icon: '💰', unlocked: gold >= 500,          tier: 'silver' },
    { id: 'gold_baron',  name: 'Gold Baron',     desc: 'Accumulate 1000 gold',           icon: '👑', unlocked: gold >= 1000,         tier: 'gold'   },
    { id: 'outlaw',      name: 'Outlaw',         desc: 'Fall below 0 honor',             icon: '💀', unlocked: honor < 0,            tier: 'bronze' },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const tierColors: Record<string, string> = {
    bronze: 'border-amber-700  bg-amber-900/30  text-amber-500',
    silver: 'border-slate-400  bg-slate-700/20  text-slate-300',
    gold:   'border-yellow-400 bg-yellow-900/20 text-yellow-300',
  };

  return (
    <div className="panel-pixel bg-rust-950/40 border-sand-500/20 py-8 px-6 space-y-6">
      <div className="flex justify-between items-center border-b-4 border-rust-900 pb-4">
        <h2 className="text-2xl font-heading tracking-widest text-terracotta-400 uppercase">Badges</h2>
        <span className="text-lg text-sand-500 font-bold">{unlockedCount}/{achievements.length}</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {achievements.map(a => (
          <div
            key={a.id}
            title={`${a.name}: ${a.desc}`}
            className={`relative flex flex-col items-center gap-1 p-2 border-2 transition-all duration-300 group
              ${a.unlocked
                ? `${tierColors[a.tier || 'bronze']} hover:scale-110 cursor-default animate-badge-pop`
                : 'border-rust-800 opacity-25 grayscale'
              }
            `}
          >
            <span className="text-2xl leading-none">{a.icon}</span>
            <span className="text-xs text-center leading-tight font-bold hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-28 bg-rust-950 border border-sand-500/30 p-2 z-50 pointer-events-none text-sand-300 normal-case font-pixel">
              {a.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

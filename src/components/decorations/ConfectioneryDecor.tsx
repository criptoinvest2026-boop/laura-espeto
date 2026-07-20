import { cn } from '@/lib/utils';

interface ConfectioneryDecorProps {
  variant?: 'dashboard' | 'sales' | 'products' | 'customers' | 'expenses' | 'reports';
  className?: string;
}

// Top Espetos — churrasco/barraca decorative emojis
const decorElements: Record<string, { emojis: string[]; positions: { top?: string; bottom?: string; left?: string; right?: string; size: string; rotate: string; opacity: string }[] }> = {
  dashboard: {
    emojis: ['🍢', '🔥', '🥩', '🍗', '🍺', '🌶️', '🥓'],
    positions: [
      { top: '-8px', right: '10px', size: '28px', rotate: '-15deg', opacity: '0.20' },
      { top: '20px', right: '60px', size: '20px', rotate: '20deg', opacity: '0.14' },
      { bottom: '-4px', right: '40px', size: '22px', rotate: '10deg', opacity: '0.16' },
      { top: '-2px', right: '110px', size: '18px', rotate: '-22deg', opacity: '0.11' },
      { top: '14px', right: '150px', size: '16px', rotate: '30deg', opacity: '0.09' },
      { bottom: '2px', right: '90px', size: '14px', rotate: '-8deg', opacity: '0.10' },
      { top: '6px', right: '185px', size: '15px', rotate: '18deg', opacity: '0.08' },
    ],
  },
  sales: {
    emojis: ['🍢', '🥩', '🍗', '🔥', '🍺', '🌭', '🧀'],
    positions: [
      { top: '-6px', right: '15px', size: '26px', rotate: '12deg', opacity: '0.18' },
      { top: '24px', right: '55px', size: '18px', rotate: '-18deg', opacity: '0.13' },
      { bottom: '0px', right: '30px', size: '20px', rotate: '8deg', opacity: '0.15' },
      { top: '0px', right: '100px', size: '16px', rotate: '-25deg', opacity: '0.10' },
      { top: '18px', right: '140px', size: '15px', rotate: '15deg', opacity: '0.09' },
      { bottom: '-2px', right: '80px', size: '14px', rotate: '-10deg', opacity: '0.08' },
      { top: '8px', right: '175px', size: '13px', rotate: '22deg', opacity: '0.07' },
    ],
  },
  products: {
    emojis: ['🥩', '🍗', '🍢', '🌭', '🧀', '🥓', '🍖'],
    positions: [
      { top: '-4px', right: '20px', size: '24px', rotate: '-10deg', opacity: '0.18' },
      { top: '18px', right: '65px', size: '20px', rotate: '15deg', opacity: '0.13' },
      { bottom: '2px', right: '45px', size: '22px', rotate: '-5deg', opacity: '0.15' },
      { top: '-2px', right: '115px', size: '17px', rotate: '28deg', opacity: '0.10' },
      { top: '22px', right: '155px', size: '14px', rotate: '-20deg', opacity: '0.09' },
      { bottom: '0px', right: '95px', size: '15px', rotate: '12deg', opacity: '0.08' },
      { top: '10px', right: '190px', size: '13px', rotate: '-16deg', opacity: '0.07' },
    ],
  },
  customers: {
    emojis: ['🍺', '🍢', '🔥', '🥩', '🧀', '🌶️', '🥤'],
    positions: [
      { top: '-6px', right: '12px', size: '26px', rotate: '8deg', opacity: '0.18' },
      { top: '22px', right: '58px', size: '18px', rotate: '-12deg', opacity: '0.13' },
      { bottom: '0px', right: '35px', size: '20px', rotate: '15deg', opacity: '0.15' },
      { top: '2px', right: '105px', size: '16px', rotate: '-20deg', opacity: '0.10' },
      { top: '16px', right: '145px', size: '15px', rotate: '25deg', opacity: '0.09' },
      { bottom: '-4px', right: '85px', size: '14px', rotate: '-6deg', opacity: '0.08' },
      { top: '4px', right: '180px', size: '13px', rotate: '14deg', opacity: '0.07' },
    ],
  },
  expenses: {
    emojis: ['🔥', '🪵', '🧂', '🥩', '🌭', '🍺', '🧊'],
    positions: [
      { top: '-8px', right: '18px', size: '24px', rotate: '-8deg', opacity: '0.18' },
      { top: '20px', right: '62px', size: '20px', rotate: '10deg', opacity: '0.13' },
      { bottom: '-2px', right: '42px', size: '22px', rotate: '-12deg', opacity: '0.15' },
      { top: '0px', right: '108px', size: '17px', rotate: '22deg', opacity: '0.10' },
      { top: '24px', right: '148px', size: '14px', rotate: '-18deg', opacity: '0.09' },
      { bottom: '2px', right: '88px', size: '15px', rotate: '8deg', opacity: '0.08' },
      { top: '6px', right: '182px', size: '13px', rotate: '-14deg', opacity: '0.07' },
    ],
  },
  reports: {
    emojis: ['📊', '🍢', '🔥', '🥩', '🍺', '💰', '🌶️'],
    positions: [
      { top: '-4px', right: '14px', size: '26px', rotate: '12deg', opacity: '0.18' },
      { top: '24px', right: '60px', size: '18px', rotate: '-15deg', opacity: '0.13' },
      { bottom: '2px', right: '38px', size: '20px', rotate: '6deg', opacity: '0.15' },
      { top: '-2px', right: '112px', size: '16px', rotate: '-24deg', opacity: '0.10' },
      { top: '18px', right: '152px', size: '15px', rotate: '20deg', opacity: '0.09' },
      { bottom: '-2px', right: '82px', size: '14px', rotate: '-10deg', opacity: '0.08' },
      { top: '8px', right: '188px', size: '13px', rotate: '16deg', opacity: '0.07' },
    ],
  },
};

export default function ConfectioneryDecor({ variant = 'dashboard', className }: ConfectioneryDecorProps) {
  const config = decorElements[variant];

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none select-none', className)}>
      {config.emojis.map((emoji, i) => {
        const pos = config.positions[i];
        return (
          <span
            key={i}
            className="absolute animate-float"
            style={{
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              right: pos.right,
              fontSize: pos.size,
              transform: `rotate(${pos.rotate})`,
              opacity: pos.opacity,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${2.5 + i * 0.4}s`,
            }}
          >
            {emoji}
          </span>
        );
      })}
    </div>
  );
}

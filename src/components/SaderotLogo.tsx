interface Props {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
  darkBg?: boolean;
}

// Brand mark: 5×3 weekly schedule grid
// Row 1: □ ■ □ ■ □
// Row 2: ■ □ 🔴 □ ■
// Row 3: □ ■ □ □ ■
const CELLS = [
  // [col, row, color-key]
  [0,0,'l'],[1,0,'d'],[2,0,'l'],[3,0,'d'],[4,0,'l'],
  [0,1,'d'],[1,1,'l'],[2,1,'r'],[3,1,'l'],[4,1,'d'],
  [0,2,'l'],[1,2,'d'],[2,2,'l'],[3,2,'l'],[4,2,'d'],
] as const;

const CELL = 11; // cell size
const GAP  = 2;  // gap between cells
const PITCH = CELL + GAP; // 13
const W = 5 * PITCH - GAP; // 63
const H = 3 * PITCH - GAP; // 37

export default function SaderotLogo({ size = 'sm', showText = true, showTagline = false, darkBg = false }: Props) {
  const heights = { sm: 28, md: 36, lg: 48 };
  const h = heights[size];
  const w = Math.round(h * W / H);

  const textSizes  = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };
  const taglineSizes = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' };

  const palette = {
    l: darkBg ? '#3a3a3a' : '#e8e8e8',
    d: darkBg ? '#ffffff' : '#1a1a1a',
    r: darkBg ? '#ff8b6e' : '#c73e1d',
  };

  return (
    <div className="flex items-center gap-2.5">
      <svg width={w} height={h} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {CELLS.map(([col, row, key]) => (
          <rect
            key={`${col}-${row}`}
            x={col * PITCH}
            y={row * PITCH}
            width={CELL}
            height={CELL}
            rx="1.5"
            fill={palette[key]}
          />
        ))}
      </svg>

      {showText && (
        <div>
          <span className={`${textSizes[size]} font-semibold tracking-tight leading-none ${darkBg ? 'text-white' : 'text-gray-900'}`}>
            sader<span style={{ color: '#c73e1d' }}>OT</span>
          </span>
          {showTagline && (
            <p className={`${taglineSizes[size]} ${darkBg ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>סדר אותי</p>
          )}
        </div>
      )}
    </div>
  );
}

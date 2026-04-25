interface Props {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
  darkBg?: boolean;
}

export default function SaderotLogo({ size = 'sm', showText = true, showTagline = false, darkBg = false }: Props) {
  const dim = size === 'sm' ? 28 : size === 'md' ? 36 : 48;
  const textSize = size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : 'text-2xl';
  const taglineSize = 'text-xs';

  // Option 4: favicon 3×3 grid mark
  // □ ■ □
  // ■ 🔴 ■
  // □ ■ □
  const light = darkBg ? '#3a3a3a' : '#e8e8e8';
  const dark  = darkBg ? '#ffffff' : '#1a1a1a';
  const red   = darkBg ? '#ff8b6e' : '#c73e1d';

  return (
    <div className="flex items-center gap-2.5">
      <svg width={dim} height={dim} viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Row 1 */}
        <rect x="0"  y="0"  width="12" height="12" rx="2" fill={light} />
        <rect x="15" y="0"  width="12" height="12" rx="2" fill={dark}  />
        <rect x="30" y="0"  width="12" height="12" rx="2" fill={light} />
        {/* Row 2 */}
        <rect x="0"  y="15" width="12" height="12" rx="2" fill={dark}  />
        <rect x="15" y="15" width="12" height="12" rx="2" fill={red}   />
        <rect x="30" y="15" width="12" height="12" rx="2" fill={dark}  />
        {/* Row 3 */}
        <rect x="0"  y="30" width="12" height="12" rx="2" fill={light} />
        <rect x="15" y="30" width="12" height="12" rx="2" fill={dark}  />
        <rect x="30" y="30" width="12" height="12" rx="2" fill={light} />
      </svg>

      {showText && (
        <div>
          <span className={`${textSize} font-semibold tracking-tight ${darkBg ? 'text-white' : 'text-gray-900'} leading-none`}>
            sader<span style={{ color: '#c73e1d' }}>OT</span>
          </span>
          {showTagline && (
            <p className={`${taglineSize} ${darkBg ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>סדר אותי</p>
          )}
        </div>
      )}
    </div>
  );
}

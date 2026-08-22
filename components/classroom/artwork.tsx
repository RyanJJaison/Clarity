import type { SVGProps } from "react";

/**
 * Hand-authored, geometric-flat SVG artwork for the classroom scene.
 * Fills reference the --classroom-* CSS custom properties (globals.css) so
 * every piece re-themes automatically between the day (light) and night
 * (dark) palettes — no separate dark-mode artwork needed. All static (no
 * per-frame JS animation); any motion is applied by the caller via
 * transform/opacity, matching the app's animation-performance rules.
 */

type ArtProps = SVGProps<SVGSVGElement>;

const shadow = (cx: number, cy: number, rx: number, ry: number) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" opacity="0.12" />
);

export function WhiteboardArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" {...props}>
      {shadow(100, 152, 70, 6)}
      <rect x="10" y="10" width="180" height="120" rx="8" fill="var(--classroom-board-frame)" />
      <rect x="18" y="18" width="164" height="104" rx="4" fill="var(--classroom-board)" />
      <path d="M34 60 L60 60 L72 44" stroke="var(--primitive-cyan)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M34 78 L100 78" stroke="var(--primitive-purple)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M34 94 L82 94" stroke="var(--primitive-purple)" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="150" cy="60" r="20" fill="none" stroke="var(--primitive-amber)" strokeWidth="3" opacity="0.8" />
      <path d="M143 60 L148 65 L158 52" stroke="var(--primitive-amber)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="18" y="126" width="164" height="10" rx="3" fill="var(--classroom-board-frame)" />
      <rect x="90" y="128" width="14" height="4" rx="2" fill="var(--primitive-purple)" />
      <rect x="108" y="128" width="14" height="4" rx="2" fill="var(--primitive-cyan)" />
    </svg>
  );
}

export function BookshelfArt(props: ArtProps) {
  const spines = [
    { x: 22, w: 12, h: 60, color: "var(--primitive-purple)" },
    { x: 36, w: 9, h: 52, color: "var(--primitive-cyan)" },
    { x: 47, w: 14, h: 64, color: "var(--primitive-amber)" },
    { x: 63, w: 10, h: 46, color: "var(--primitive-green)" },
    { x: 75, w: 11, h: 58, color: "var(--primitive-indigo)" },
    { x: 130, w: 13, h: 56, color: "var(--primitive-amber)" },
    { x: 145, w: 9, h: 44, color: "var(--primitive-purple)" },
    { x: 156, w: 12, h: 62, color: "var(--primitive-cyan)" },
    { x: 170, w: 10, h: 50, color: "var(--primitive-indigo)" },
  ];
  return (
    <svg viewBox="0 0 200 170" fill="none" {...props}>
      {shadow(100, 162, 75, 6)}
      <rect x="8" y="8" width="184" height="150" rx="6" fill="var(--classroom-wood-dark)" />
      <rect x="16" y="16" width="168" height="42" rx="2" fill="var(--classroom-wood-light)" />
      <rect x="16" y="64" width="168" height="42" rx="2" fill="var(--classroom-wood-light)" />
      <rect x="16" y="112" width="168" height="38" rx="2" fill="var(--classroom-wood-light)" />
      {spines.slice(0, 5).map((s) => (
        <rect key={s.x} x={s.x} y={58 - s.h} width={s.w} height={s.h} rx="2" fill={s.color} />
      ))}
      {spines.slice(5).map((s) => (
        <rect key={s.x} x={s.x} y={106 - s.h} width={s.w} height={s.h} rx="2" fill={s.color} />
      ))}
      <rect x="30" y="118" width="20" height="26" rx="2" fill="var(--primitive-cyan)" opacity="0.85" />
      <rect x="56" y="122" width="16" height="22" rx="2" fill="var(--primitive-purple)" opacity="0.85" />
    </svg>
  );
}

export function DeskArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 220 170" fill="none" {...props}>
      {shadow(110, 158, 95, 8)}
      <rect x="20" y="90" width="180" height="12" rx="4" fill="var(--classroom-wood-dark)" />
      <rect x="30" y="102" width="12" height="46" rx="2" fill="var(--classroom-wood-dark)" />
      <rect x="178" y="102" width="12" height="46" rx="2" fill="var(--classroom-wood-dark)" />
      <rect x="16" y="82" width="188" height="10" rx="4" fill="var(--classroom-wood-light)" />
      {/* open notebook */}
      <g transform="translate(56 52)">
        <rect x="0" y="16" width="56" height="34" rx="3" fill="#ffffff" opacity="0.95" />
        <rect x="0" y="16" width="56" height="34" rx="3" fill="none" stroke="var(--classroom-wood-dark)" strokeWidth="1.5" />
        <line x1="28" y1="16" x2="28" y2="50" stroke="var(--classroom-wood-dark)" strokeWidth="1" opacity="0.5" />
        <line x1="6" y1="26" x2="24" y2="26" stroke="var(--primitive-purple)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="6" y1="34" x2="22" y2="34" stroke="var(--primitive-purple)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <line x1="32" y1="26" x2="50" y2="26" stroke="var(--primitive-cyan)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="32" y1="34" x2="46" y2="34" stroke="var(--primitive-cyan)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </g>
      {/* mug */}
      <g transform="translate(140 58)">
        <rect x="0" y="8" width="18" height="20" rx="3" fill="var(--primitive-amber)" />
        <path d="M18 12 q8 0 8 8 t-8 8" stroke="var(--primitive-amber)" strokeWidth="2.5" fill="none" />
      </g>
      {/* small plant accent */}
      <g transform="translate(24 46)">
        <rect x="0" y="20" width="16" height="14" rx="2" fill="var(--classroom-wood-dark)" />
        <path d="M8 20 C 2 10 2 4 8 -2 C 14 4 14 10 8 20" fill="var(--classroom-plant)" />
        <path d="M8 20 C 4 12 12 8 8 -2" fill="var(--classroom-plant-dark)" opacity="0.5" />
      </g>
    </svg>
  );
}

export function ComputerArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 180 160" fill="none" {...props}>
      {shadow(90, 150, 65, 6)}
      <rect x="30" y="20" width="120" height="80" rx="6" fill="var(--classroom-metal)" />
      <rect x="38" y="28" width="104" height="64" rx="2" fill="var(--classroom-board)" />
      <rect x="80" y="100" width="20" height="18" fill="var(--classroom-metal)" />
      <rect x="56" y="118" width="68" height="8" rx="3" fill="var(--classroom-metal)" />
      {/* sparkle / AI glow */}
      <circle cx="90" cy="60" r="16" fill="var(--primitive-purple)" opacity="0.18" />
      <path
        d="M90 46 L93.5 57 L104 60 L93.5 63 L90 74 L86.5 63 L76 60 L86.5 57 Z"
        fill="var(--primitive-cyan)"
      />
      <circle cx="112" cy="46" r="3" fill="var(--primitive-purple)" opacity="0.8" />
      <circle cx="70" cy="72" r="2.5" fill="var(--primitive-purple)" opacity="0.6" />
    </svg>
  );
}

export function NoticeBoardArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 180 150" fill="none" {...props}>
      {shadow(90, 142, 62, 6)}
      <rect x="10" y="10" width="160" height="118" rx="8" fill="var(--classroom-board-frame)" />
      <rect x="18" y="18" width="144" height="102" rx="4" fill="var(--classroom-cork)" />
      <g transform="translate(32 30) rotate(-4)">
        <rect width="42" height="30" rx="2" fill="#ffffff" opacity="0.92" />
        <line x1="6" y1="9" x2="34" y2="9" stroke="var(--classroom-wood-dark)" strokeWidth="1.5" opacity="0.4" />
        <line x1="6" y1="16" x2="28" y2="16" stroke="var(--classroom-wood-dark)" strokeWidth="1.5" opacity="0.4" />
      </g>
      <circle cx="53" cy="30" r="2.5" fill="var(--primitive-red)" />
      <g transform="translate(90 24) rotate(3)">
        <rect width="42" height="30" rx="2" fill="var(--primitive-cyan)" opacity="0.85" />
        <line x1="6" y1="9" x2="34" y2="9" stroke="white" strokeWidth="1.5" opacity="0.5" />
        <line x1="6" y1="16" x2="24" y2="16" stroke="white" strokeWidth="1.5" opacity="0.5" />
      </g>
      <circle cx="111" cy="24" r="2.5" fill="var(--primitive-red)" />
      <g transform="translate(60 68) rotate(-2)">
        <rect width="48" height="32" rx="2" fill="var(--primitive-amber)" opacity="0.85" />
        <line x1="6" y1="10" x2="38" y2="10" stroke="white" strokeWidth="1.5" opacity="0.5" />
        <line x1="6" y1="18" x2="30" y2="18" stroke="white" strokeWidth="1.5" opacity="0.5" />
      </g>
      <circle cx="84" cy="68" r="2.5" fill="var(--primitive-red)" />
    </svg>
  );
}

export function CalendarArt(props: ArtProps) {
  const days = Array.from({ length: 21 });
  return (
    <svg viewBox="0 0 160 170" fill="none" {...props}>
      {shadow(80, 160, 55, 6)}
      <rect x="14" y="14" width="132" height="140" rx="8" fill="var(--classroom-board)" stroke="var(--classroom-board-frame)" strokeWidth="3" />
      <rect x="14" y="14" width="132" height="30" rx="8" fill="var(--primitive-purple)" />
      <rect x="34" y="6" width="8" height="18" rx="3" fill="var(--classroom-metal)" />
      <rect x="118" y="6" width="8" height="18" rx="3" fill="var(--classroom-metal)" />
      {days.map((_, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        const x = 26 + col * 15;
        const y = 62 + row * 22;
        const isMarked = i === 10;
        return isMarked ? (
          <circle key="d" cx={x + 5} cy={y + 4} r="8" fill="var(--primitive-cyan)" />
        ) : (
          <rect key={i} x={x} y={y} width="10" height="6" rx="2" fill="var(--classroom-metal)" opacity="0.55" />
        );
      })}
    </svg>
  );
}

export function TrophyShelfArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" {...props}>
      {shadow(100, 150, 78, 6)}
      <rect x="16" y="110" width="168" height="14" rx="3" fill="var(--classroom-wood-dark)" />
      <rect x="16" y="60" width="168" height="10" rx="3" fill="var(--classroom-wood-dark)" opacity="0.8" />
      {/* trophy */}
      <g transform="translate(66 62)">
        <path d="M4 0 H36 L33 20 Q20 28 7 20 Z" fill="var(--primitive-amber)" />
        <path d="M4 2 C -8 2 -8 16 4 16" stroke="var(--primitive-amber)" strokeWidth="3" fill="none" />
        <path d="M36 2 C 48 2 48 16 36 16" stroke="var(--primitive-amber)" strokeWidth="3" fill="none" />
        <rect x="16" y="28" width="8" height="10" fill="var(--primitive-amber)" />
        <rect x="10" y="38" width="20" height="6" rx="2" fill="var(--classroom-wood-dark)" />
      </g>
      {/* medal */}
      <g transform="translate(130 74)">
        <circle cx="0" cy="0" r="15" fill="var(--primitive-cyan)" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
        <path d="M-6 12 L-10 26 L0 20 L10 26 L6 12" fill="var(--primitive-purple)" />
      </g>
      {/* small cup */}
      <g transform="translate(38 82)">
        <path d="M0 0 H20 L17 14 Q10 19 3 14 Z" fill="var(--primitive-purple)" />
        <rect x="6" y="18" width="8" height="6" fill="var(--classroom-wood-dark)" />
      </g>
    </svg>
  );
}

export function WindowArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 220 260" fill="none" {...props}>
      <rect x="0" y="0" width="220" height="260" rx="10" fill="var(--classroom-board-frame)" />
      <rect x="12" y="12" width="196" height="236" rx="4" fill="url(#sky)" />
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--classroom-sky-top)" />
          <stop offset="100%" stopColor="var(--classroom-sky-bottom)" />
        </linearGradient>
      </defs>
      <circle cx="165" cy="55" r="22" fill="var(--classroom-sun)" opacity="0.9" />
      <ellipse cx="60" cy="90" rx="34" ry="14" fill="white" opacity="0.35" />
      <ellipse cx="100" cy="80" rx="24" ry="10" fill="white" opacity="0.25" />
      <path d="M12 210 Q60 180 110 205 T208 200 V248 H12 Z" fill="var(--classroom-plant-dark)" opacity="0.5" />
      <rect x="12" y="12" width="196" height="236" rx="4" fill="none" stroke="var(--classroom-board-frame)" strokeWidth="6" />
      <line x1="110" y1="12" x2="110" y2="248" stroke="var(--classroom-board-frame)" strokeWidth="6" />
      <line x1="12" y1="130" x2="208" y2="130" stroke="var(--classroom-board-frame)" strokeWidth="6" />
    </svg>
  );
}

export function PlantArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 100 140" fill="none" {...props}>
      {shadow(50, 132, 32, 5)}
      <path d="M30 130 L36 90 H64 L70 130 Z" fill="var(--classroom-wood-dark)" />
      <path d="M50 90 C 20 70 20 30 50 10 C 80 30 80 70 50 90" fill="var(--classroom-plant)" />
      <path d="M50 90 C 32 66 34 34 50 10" fill="var(--classroom-plant-dark)" opacity="0.4" />
      <path d="M50 90 C 30 76 60 56 50 30" stroke="var(--classroom-plant-dark)" strokeWidth="2" fill="none" opacity="0.5" />
    </svg>
  );
}

export function ClockArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" {...props}>
      <circle cx="50" cy="50" r="44" fill="var(--classroom-board)" stroke="var(--classroom-board-frame)" strokeWidth="6" />
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="12"
          x2="50"
          y2="18"
          stroke="var(--classroom-board-frame)"
          strokeWidth="3"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
      <line x1="50" y1="50" x2="50" y2="26" stroke="var(--primitive-purple)" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="50" y1="50" x2="68" y2="56" stroke="var(--primitive-cyan)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="50" r="3" fill="var(--classroom-board-frame)" />
    </svg>
  );
}

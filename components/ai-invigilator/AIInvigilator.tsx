import { cn } from "@/lib/utils";

export type InvigilatorState =
  | "idle"
  | "greeting"
  | "thinking"
  | "listening"
  | "explaining"
  | "celebrating"
  | "focus"
  | "success"
  | "error";

interface FaceConfig {
  eyebrows: "relaxed" | "raised" | "think" | "focused" | "concerned";
  eyes: "open" | "happy" | "wide" | "narrow" | "soft";
  mouth: "smile" | "bigSmile" | "pursed" | "flat" | "open";
  accent: "none" | "spark" | "dots" | "waves" | "ring" | "check";
}

const FACE: Record<InvigilatorState, FaceConfig> = {
  idle: { eyebrows: "relaxed", eyes: "open", mouth: "smile", accent: "none" },
  greeting: { eyebrows: "raised", eyes: "happy", mouth: "bigSmile", accent: "spark" },
  thinking: { eyebrows: "think", eyes: "narrow", mouth: "pursed", accent: "dots" },
  listening: { eyebrows: "raised", eyes: "wide", mouth: "flat", accent: "waves" },
  explaining: { eyebrows: "relaxed", eyes: "open", mouth: "open", accent: "spark" },
  celebrating: { eyebrows: "raised", eyes: "happy", mouth: "bigSmile", accent: "spark" },
  focus: { eyebrows: "focused", eyes: "narrow", mouth: "flat", accent: "ring" },
  success: { eyebrows: "relaxed", eyes: "happy", mouth: "smile", accent: "check" },
  error: { eyebrows: "concerned", eyes: "soft", mouth: "flat", accent: "none" },
};

function Eyebrows({ variant }: { variant: FaceConfig["eyebrows"] }) {
  const stroke = "var(--invigilator-hair)";
  switch (variant) {
    case "raised":
      return (
        <>
          <path d="M32 33 Q37.5 29 43 32" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M57 32 Q62.5 29 68 33" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      );
    case "think":
      return (
        <>
          <path d="M32 34 Q37.5 31 43 33.5" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M57 31 Q62.5 27 68 30" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      );
    case "focused":
      return (
        <>
          <path d="M32 34.5 Q37.5 33 43 35" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M57 35 Q62.5 33 68 34.5" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      );
    case "concerned":
      return (
        <>
          <path d="M32 32 Q37.5 34.5 43 34" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M57 34 Q62.5 34.5 68 32" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      );
    default:
      return (
        <>
          <path d="M32 33.5 Q37.5 31 43 33" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M57 33 Q62.5 31 68 33.5" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      );
  }
}

function Eye({ cx, variant }: { cx: number; variant: FaceConfig["eyes"] }) {
  if (variant === "happy") {
    return <path d={`M${cx - 5} 40 Q${cx} 35.5 ${cx + 5} 40`} stroke="var(--invigilator-hair)" strokeWidth="2.2" strokeLinecap="round" fill="none" />;
  }
  if (variant === "soft") {
    return <path d={`M${cx - 5} 38.5 Q${cx} 41.5 ${cx + 5} 38.5`} stroke="var(--invigilator-hair)" strokeWidth="2.2" strokeLinecap="round" fill="none" />;
  }
  const ry = variant === "wide" ? 5.2 : variant === "narrow" ? 3.4 : 4.4;
  return (
    <g>
      <ellipse cx={cx} cy="39" rx="4.6" ry={ry} fill="white" />
      <circle cx={cx} cy="39.4" r="2.3" fill="var(--invigilator-hair)" />
      <circle cx={cx + 0.8} cy="38.6" r="0.7" fill="white" />
    </g>
  );
}

function Mouth({ variant }: { variant: FaceConfig["mouth"] }) {
  switch (variant) {
    case "bigSmile":
      return <path d="M42 55 Q50 62.5 58 55 Q50 60 42 55 Z" fill="var(--invigilator-blush)" opacity="0.85" />;
    case "smile":
      return <path d="M43 55 Q50 59 57 55" stroke="var(--invigilator-blush)" strokeWidth="2.6" strokeLinecap="round" fill="none" />;
    case "pursed":
      return <ellipse cx="50" cy="56" rx="2.6" ry="2" fill="var(--invigilator-blush)" opacity="0.85" />;
    case "open":
      return <ellipse cx="50" cy="56.5" rx="5" ry="4" fill="var(--invigilator-hair)" opacity="0.75" />;
    default:
      return <line x1="44" y1="56" x2="56" y2="56" stroke="var(--invigilator-blush)" strokeWidth="2.4" strokeLinecap="round" />;
  }
}

interface AIInvigilatorProps {
  state?: InvigilatorState;
  size?: number;
  className?: string;
  /** Fill the parent's width (e.g. a percentage-sized slot in the classroom scene) instead of a fixed pixel size. */
  fluid?: boolean;
}

/**
 * Clarity's mascot: a calm, stylized-illustration teacher/companion — not a
 * mascot blob, not a floating AI orb. Head + shoulders bust, soft flat-
 * illustration shading, subtle facial expression per state. Idle motion
 * (float + blink) is pure CSS keyframes (globals.css), not per-frame React
 * state, and is automatically neutralized under prefers-reduced-motion by
 * the same global rule every other animation respects.
 */
export function AIInvigilator({ state = "idle", size = 96, className, fluid = false }: AIInvigilatorProps) {
  const face = FACE[state];

  return (
    <div
      className={cn("inline-block aspect-[5/6]", fluid && "w-full", className)}
      style={{ width: fluid ? undefined : size, animation: "invigilator-float 4s ease-in-out infinite" }}
      role="img"
      aria-label={`Clarity AI companion — ${state}`}
    >
      <svg viewBox="0 0 100 120" fill="none" className="w-full h-full drop-shadow-lg">
        <defs>
          <linearGradient id="invigilator-skin-grad" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="var(--invigilator-skin)" />
            <stop offset="100%" stopColor="var(--invigilator-skin-shadow)" />
          </linearGradient>
          <linearGradient id="invigilator-clothing-grad" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="var(--invigilator-clothing)" />
            <stop offset="100%" stopColor="var(--invigilator-clothing-shadow)" />
          </linearGradient>
        </defs>

        {face.accent === "ring" && (
          <circle cx="50" cy="55" r="47" fill="none" stroke="var(--primitive-purple)" strokeWidth="2" opacity="0.3" />
        )}

        {/* Shoulders / clothing */}
        <path
          d="M6 120 C6 98 22 82 50 82 C78 82 94 98 94 120 Z"
          fill="url(#invigilator-clothing-grad)"
        />
        <path d="M42 84 Q50 90 58 84 L58 92 Q50 97 42 92 Z" fill="var(--invigilator-clothing-shadow)" opacity="0.7" />

        {/* Neck */}
        <path d="M40 66 L40 84 Q50 90 60 84 L60 66 Z" fill="var(--invigilator-skin-shadow)" />

        {/* Head */}
        <ellipse cx="50" cy="42" rx="25" ry="27" fill="url(#invigilator-skin-grad)" />

        {/* Blush */}
        <ellipse cx="33" cy="49" rx="4.5" ry="3" fill="var(--invigilator-blush)" opacity="0.35" />
        <ellipse cx="67" cy="49" rx="4.5" ry="3" fill="var(--invigilator-blush)" opacity="0.35" />

        {/* Hair */}
        <path
          d="M24 40 C22 20 34 10 50 10 C66 10 78 20 76 40 C76 32 70 34 68 30 C64 34 58 26 50 26 C42 26 36 34 32 30 C30 34 24 32 24 40 Z"
          fill="var(--invigilator-hair)"
        />

        <g style={{ transformOrigin: "50px 40px", animation: "invigilator-blink 5.5s ease-in-out infinite" }}>
          <Eyebrows variant={face.eyebrows} />
          <Eye cx={39} variant={face.eyes} />
          <Eye cx={61} variant={face.eyes} />
        </g>

        {/* Nose */}
        <path d="M49 43 Q47.5 47 50 48.5" stroke="var(--invigilator-skin-shadow)" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />

        <Mouth variant={face.mouth} />

        {/* Accent decoration */}
        {face.accent === "spark" && (
          <path d="M84 18 L86 24 L92 26 L86 28 L84 34 L82 28 L76 26 L82 24 Z" fill="var(--primitive-cyan)" />
        )}
        {face.accent === "dots" && (
          <>
            <circle cx="78" cy="16" r="2.3" fill="var(--primitive-purple)" opacity="0.9" />
            <circle cx="85" cy="12" r="1.8" fill="var(--primitive-purple)" opacity="0.6" />
            <circle cx="91" cy="17" r="1.3" fill="var(--primitive-purple)" opacity="0.4" />
          </>
        )}
        {face.accent === "waves" && (
          <>
            <path d="M92 36 Q98 42 92 48" stroke="var(--primitive-cyan)" strokeWidth="2" fill="none" opacity="0.7" />
            <path d="M96 32 Q104 42 96 52" stroke="var(--primitive-cyan)" strokeWidth="2" fill="none" opacity="0.4" />
          </>
        )}
        {face.accent === "check" && (
          <g transform="translate(78 10)">
            <circle cx="8" cy="8" r="8.5" fill="var(--primitive-green)" />
            <path d="M4 8 L7 11 L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
}

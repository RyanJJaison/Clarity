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

interface StateConfig {
  /** Eye shape: normal, happy (curved closed), wide (attentive), soft (concerned). */
  eyes: "normal" | "happy" | "wide" | "soft";
  mouth: "smile" | "bigSmile" | "o" | "flat" | "open";
  accent: "none" | "spark" | "dots" | "waves" | "ring" | "check";
}

const STATE_CONFIG: Record<InvigilatorState, StateConfig> = {
  idle: { eyes: "normal", mouth: "smile", accent: "none" },
  greeting: { eyes: "happy", mouth: "smile", accent: "spark" },
  thinking: { eyes: "normal", mouth: "o", accent: "dots" },
  listening: { eyes: "wide", mouth: "flat", accent: "waves" },
  explaining: { eyes: "normal", mouth: "open", accent: "spark" },
  celebrating: { eyes: "happy", mouth: "bigSmile", accent: "spark" },
  focus: { eyes: "normal", mouth: "flat", accent: "ring" },
  success: { eyes: "happy", mouth: "smile", accent: "check" },
  error: { eyes: "soft", mouth: "flat", accent: "none" },
};

interface AIInvigilatorProps {
  state?: InvigilatorState;
  size?: number;
  className?: string;
}

/**
 * Clarity's mascot: a supportive mentor, not a proctor. Deliberately
 * abstract/geometric rather than a realistic face — sophisticated without
 * reaching for photorealism or a cartoon-childish style. Idle motion
 * (float + blink) is pure CSS keyframes (see globals.css), not per-frame
 * React state, and is automatically neutralized under
 * prefers-reduced-motion by the same global rule every other animation
 * respects.
 */
export function AIInvigilator({ state = "idle", size = 96, className }: AIInvigilatorProps) {
  const config = STATE_CONFIG[state];

  return (
    <div
      className={cn("inline-block", className)}
      style={{ width: size, height: size, animation: "invigilator-float 4s ease-in-out infinite" }}
      role="img"
      aria-label={`Clarity AI assistant — ${state}`}
    >
      <svg viewBox="0 0 96 96" fill="none" className="w-full h-full drop-shadow-lg">
        <defs>
          <linearGradient id="invigilator-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primitive-purple)" />
            <stop offset="100%" stopColor="var(--primitive-cyan)" />
          </linearGradient>
        </defs>

        {config.accent === "ring" && (
          <circle cx="48" cy="48" r="44" fill="none" stroke="var(--primitive-purple)" strokeWidth="2" opacity="0.35" />
        )}

        {/* Body */}
        <rect x="12" y="14" width="72" height="68" rx="26" fill="url(#invigilator-body)" />
        <rect x="12" y="14" width="72" height="68" rx="26" fill="white" opacity="0.06" />

        {/* Eyes */}
        <g style={{ transformOrigin: "48px 44px", animation: "invigilator-blink 5.5s ease-in-out infinite" }}>
          {config.eyes === "happy" ? (
            <>
              <path d="M32 42 Q37 36 42 42" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M54 42 Q59 36 64 42" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </>
          ) : config.eyes === "wide" ? (
            <>
              <circle cx="37" cy="42" r="5.5" fill="white" />
              <circle cx="59" cy="42" r="5.5" fill="white" />
            </>
          ) : config.eyes === "soft" ? (
            <>
              <path d="M32 40 Q37 44 42 40" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M54 40 Q59 44 64 40" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <circle cx="37" cy="42" r="4.5" fill="white" />
              <circle cx="59" cy="42" r="4.5" fill="white" />
            </>
          )}
        </g>

        {/* Mouth */}
        {config.mouth === "smile" && (
          <path d="M38 58 Q48 65 58 58" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        )}
        {config.mouth === "bigSmile" && (
          <path d="M34 56 Q48 70 62 56" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        )}
        {config.mouth === "o" && <circle cx="48" cy="60" r="5" fill="white" opacity="0.9" />}
        {config.mouth === "flat" && <line x1="40" y1="59" x2="56" y2="59" stroke="white" strokeWidth="3.5" strokeLinecap="round" />}
        {config.mouth === "open" && <rect x="41" y="55" width="14" height="10" rx="5" fill="white" opacity="0.9" />}

        {/* Accent decoration */}
        {config.accent === "spark" && (
          <path
            d="M78 18 L80 24 L86 26 L80 28 L78 34 L76 28 L70 26 L76 24 Z"
            fill="var(--primitive-cyan)"
          />
        )}
        {config.accent === "dots" && (
          <>
            <circle cx="68" cy="16" r="2.5" fill="var(--primitive-purple)" opacity="0.9" />
            <circle cx="76" cy="12" r="2" fill="var(--primitive-purple)" opacity="0.6" />
            <circle cx="82" cy="18" r="1.5" fill="var(--primitive-purple)" opacity="0.4" />
          </>
        )}
        {config.accent === "waves" && (
          <>
            <path d="M84 38 Q90 44 84 50" stroke="var(--primitive-cyan)" strokeWidth="2" fill="none" opacity="0.7" />
            <path d="M88 34 Q96 44 88 54" stroke="var(--primitive-cyan)" strokeWidth="2" fill="none" opacity="0.4" />
          </>
        )}
        {config.accent === "check" && (
          <g transform="translate(70 12)">
            <circle cx="8" cy="8" r="9" fill="var(--primitive-green)" />
            <path d="M4 8 L7 11 L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
}

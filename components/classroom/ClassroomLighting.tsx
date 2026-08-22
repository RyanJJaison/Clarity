/**
 * Static lighting overlay: a soft warm light pool falling from the window
 * direction, plus a subtle edge vignette for depth. Pure CSS gradients —
 * no JS, no animation, negligible paint cost, and it re-themes for free
 * since it reads the --classroom-sun / --primitive-purple custom
 * properties that already flip between the day and night palettes.
 */
export function ClassroomLighting() {
  return (
    <div className="absolute inset-0 rounded-3xl pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-70 dark:opacity-40"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 0%, color-mix(in oklch, var(--classroom-sun) 45%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-0 dark:opacity-30"
        style={{
          background: "radial-gradient(50% 40% at 80% 100%, var(--primitive-purple), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 80px 20px color-mix(in oklch, var(--classroom-wall-bottom) 60%, transparent)",
        }}
      />
    </div>
  );
}

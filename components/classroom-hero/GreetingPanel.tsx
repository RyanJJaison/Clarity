import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";

function timeOfDayGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Derives a friendly first name from an email local-part; falls back to no name if it doesn't clean up well. */
function friendlyName(email: string): string | null {
  const local = email.split("@")[0];
  const first = local.split(/[._-]/)[0].replace(/\d+$/, "");
  if (first.length < 2) return null;
  return first[0].toUpperCase() + first.slice(1);
}

export function GreetingPanel({ email, now = new Date() }: { email: string; now?: Date }) {
  const name = friendlyName(email);
  const greeting = timeOfDayGreeting(now);

  return (
    <GlassPanel className="flex flex-col gap-1 p-[18px]">
      <div className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-primary" aria-hidden="true" />
        <span className="font-heading text-[22px] font-extrabold">Clarity</span>
        <Badge variant="secondary" className="text-[10px] font-bold uppercase text-primary bg-primary/12">
          AI Space
        </Badge>
      </div>
      <p className="text-[15px] font-medium text-subtle">
        {greeting}
        {name ? `, ${name}` : ""}. Ready to explore?
      </p>
    </GlassPanel>
  );
}

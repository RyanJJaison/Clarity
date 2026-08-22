import { CalendarIcon } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export default function SchedulePage() {
  return (
    <ComingSoon
      icon={CalendarIcon}
      title="Schedule"
      description="A study calendar isn't built yet. Your spaced-repetition due dates already live in Review — this page will bring everything else together."
    />
  );
}

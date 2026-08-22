import { TrophyIcon } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export default function AchievementsPage() {
  return (
    <ComingSoon
      icon={TrophyIcon}
      title="Achievements"
      description="Badges and milestones aren't built yet. Your real progress — mastery, streak, and review activity — already shows up on the dashboard."
    />
  );
}

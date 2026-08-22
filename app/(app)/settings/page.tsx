import { SettingsIcon } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={SettingsIcon}
      title="Settings"
      description="Account and preference settings aren't built yet. Theme, and signing out, are available from the profile menu in the meantime."
    />
  );
}

import { ClipboardListIcon } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export default function AssignmentsPage() {
  return (
    <ComingSoon
      icon={ClipboardListIcon}
      title="Assignments"
      description="Assignment tracking isn't built yet — this is where upcoming and completed work will show up once it is."
    />
  );
}

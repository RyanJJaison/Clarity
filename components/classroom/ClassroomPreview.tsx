import { ClassroomBackground } from "./ClassroomBackground";
import { ClassroomLighting } from "./ClassroomLighting";
import { WhiteboardArt, DeskArt, BookshelfArt, ComputerArt } from "./artwork";
import { AIInvigilator } from "@/components/ai-invigilator/AIInvigilator";
import { InvigilatorBubble } from "@/components/ai-invigilator/InvigilatorBubble";

/**
 * A static, illustrative preview of the classroom for signed-out visitors —
 * not wired to real data (there isn't any before login), and not
 * interactive nav (the objects aren't real destinations for a visitor who
 * isn't signed in yet). The example message is clearly a sample, not a
 * claim about anyone's real progress.
 */
export function ClassroomPreview() {
  return (
    <div
      className="relative w-full aspect-[16/10] sm:aspect-[16/8] rounded-3xl overflow-hidden ring-1 ring-[var(--glass-border)]"
      aria-hidden="true"
    >
      <ClassroomBackground />
      <ClassroomLighting />

      <div className="absolute left-[34%] top-[4%] w-[28%]">
        <WhiteboardArt className="w-full h-auto drop-shadow-lg" />
      </div>
      <div className="absolute left-[1%] top-[40%] w-[19%]">
        <BookshelfArt className="w-full h-auto drop-shadow-lg" />
      </div>
      <div className="absolute left-[24%] top-[62%] w-[38%]">
        <DeskArt className="w-full h-auto drop-shadow-lg" />
      </div>
      <div className="absolute left-[40%] top-[44%] w-[17%]">
        <ComputerArt className="w-full h-auto drop-shadow-lg" />
      </div>

      <div className="absolute left-[60%] top-[48%] w-[14%] max-w-32 z-10">
        <AIInvigilator state="greeting" fluid />
      </div>
      <div className="absolute left-[74%] top-[30%] w-1/4 max-w-64 z-10">
        <InvigilatorBubble message="Welcome back. Ready to continue Algebra?" />
      </div>
    </div>
  );
}

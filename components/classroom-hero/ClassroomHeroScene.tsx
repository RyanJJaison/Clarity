"use client";

import { useState } from "react";
import Image from "next/image";
import { Flame, ClipboardListIcon, CalendarIcon } from "lucide-react";
import type { CourseSummary } from "@/components/navigation/nav-config";
import type { ObjectiveSummary } from "@/lib/dashboard-data";
import { GreetingPanel } from "./GreetingPanel";
import { ProfilePanel } from "./ProfilePanel";
import { WhiteboardPanel } from "./WhiteboardPanel";
import { StudySubjectPanel } from "./StudySubjectPanel";
import { StatCard } from "./StatCard";
import { ActiveSubjectPanel } from "./ActiveSubjectPanel";
import { AskClarityBar } from "./AskClarityBar";
import { InteractiveHotspot } from "./InteractiveHotspot";
import { InteractiveBook } from "./InteractiveBook";
import { Invigilator } from "./Invigilator";
import { GlowRegion } from "./GlowRegion";
import { AmbientLayer, type LightingMood } from "./AmbientLayer";
import { EasterEggMessage } from "./EasterEggMessage";
import { useEasterEggMessage } from "./useEasterEggMessage";
import { rectToPositionPercent } from "./backgroundCrop";
import { BOOK_TRIVIA, PLANT_MESSAGE } from "./trivia";

const HERO_IMAGE = "/classroom/dashboard-scene-source.png";

const BOOK_SLOTS = [
  { x: 1066, y: 220, w: 130, h: 180, tilt: -1 },
  { x: 1214, y: 220, w: 130, h: 180, tilt: 1.5 },
  { x: 1066, y: 415, w: 130, h: 180, tilt: 1 },
  { x: 1214, y: 415, w: 130, h: 180, tilt: -1.5 },
  { x: 1066, y: 610, w: 130, h: 180, tilt: -0.5 },
  { x: 1214, y: 610, w: 130, h: 180, tilt: 2 },
];

const CLOCK_RECT = { x: 713, y: 155, w: 130, h: 130 };
const NOTICEBOARD_RECT = { x: 1300, y: 300, w: 140, h: 320 };
const WINDOW_RECT = { x: 0, y: 0, w: 190, h: 700 };
const PLANT_RECT = { x: 216, y: 508, w: 158, h: 158 };
const INVIGILATOR_RECT = { x: 940, y: 470, w: 200, h: 240 };

interface ClassroomHeroSceneProps {
  email: string;
  courses: CourseSummary[];
  todaysFocus: ObjectiveSummary;
  continueLearning: ObjectiveSummary | null;
  focusCourse: CourseSummary | null;
  focusCourseProgress: number | null;
  streak: number;
  dueCount: number;
}

export function ClassroomHeroScene({
  email,
  courses,
  todaysFocus,
  continueLearning,
  focusCourse,
  focusCourseProgress,
  streak,
  dueCount,
}: ClassroomHeroSceneProps) {
  const [lightingMood, setLightingMood] = useState<LightingMood>("morning");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const { message: eggMessage, show: showEgg } = useEasterEggMessage();

  const hasNoCourseYet = todaysFocus.href === "/courses/new";

  const weeklyConsistency = streak > 0 ? Math.min(100, Math.round((streak / 7) * 100)) : 0;

  const bookAssignments = BOOK_SLOTS.map((slot, i) => ({
    slot,
    course: courses[i] ?? null,
    trivia: BOOK_TRIVIA[i % BOOK_TRIVIA.length],
  }));

  function cycleLighting() {
    setLightingMood((m) => (m === "morning" ? "golden" : m === "golden" ? "cool" : "morning"));
  }

  return (
    <div className="relative w-full aspect-[16/10] overflow-hidden rounded-3xl ring-1 ring-[var(--glass-border)] shadow-glass">
      <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
      <AmbientLayer mood={lightingMood} />

      {/* Top row */}
      <div className="absolute" style={rectToPositionPercent({ x: 36, y: 32, w: 280, h: 88 })}>
        <GreetingPanel email={email} />
      </div>
      <div className="absolute" style={rectToPositionPercent({ x: 1240, y: 32, w: 168, h: 52 })}>
        <ProfilePanel email={email} />
      </div>

      {/* Whiteboard — Section 4. No course yet: zoom in to the intake panel in place. */}
      {hasNoCourseYet ? (
        <WhiteboardPanel title={todaysFocus.title} detail={todaysFocus.detail} onActivate={() => setIntakeOpen(true)} />
      ) : (
        <WhiteboardPanel title={todaysFocus.title} detail={todaysFocus.detail} href={todaysFocus.href} />
      )}
      <StudySubjectPanel open={intakeOpen} onOpenChange={setIntakeOpen} />

      {/* Left column stats */}
      <StatCard icon={Flame} label="Streak" value={streak} suffix={streak === 1 ? " Day" : " Days"} position={{ x: 36, y: 200, w: 200, h: 100 }} iconClassName="bg-warning/15 text-warning" />
      <StatCard icon={ClipboardListIcon} label="Due for review" value={dueCount} position={{ x: 36, y: 316, w: 200, h: 100 }} iconClassName="bg-accent/15 text-accent" />

      {/* Active subject / continue learning */}
      {continueLearning && (
        <ActiveSubjectPanel
          title={continueLearning.title}
          subtitle={focusCourse ? `${focusCourse.mode} course` : ""}
          progressPercent={focusCourseProgress !== null ? Math.round(focusCourseProgress * 100) : 0}
        />
      )}

      {/* Weekly consistency (Weekly Goal ring substitute — real data) */}
      <StatCard
        icon={CalendarIcon}
        label="This week"
        value={weeklyConsistency}
        suffix="%"
        position={{ x: 1200, y: 455, w: 200, h: 100 }}
        iconClassName="bg-primary/15 text-primary"
      />

      {/* Computer → AI Tutor (Section 5) */}
      <AskClarityBar />

      {/* Clock → Focus Mode (Section 7) */}
      <InteractiveHotspot href="/focus" label="Clock — Focus Mode" tooltip="FOCUS MODE" position={rectToPositionPercent(CLOCK_RECT)} brighten>
        <GlowRegion shape="circle" />
      </InteractiveHotspot>

      {/* Notice board → Assignments (Section 6) */}
      <InteractiveHotspot href="/assignments" label="Notice board — Upcoming" tooltip="UPCOMING" position={rectToPositionPercent(NOTICEBOARD_RECT)} brighten>
        <GlowRegion shape="rect" />
      </InteractiveHotspot>

      {/* Window — Easter egg: lighting mood */}
      <InteractiveHotspot
        onActivate={cycleLighting}
        label="Window — the light shifts"
        position={rectToPositionPercent(WINDOW_RECT)}
      >
        <GlowRegion shape="rect" className="bg-[radial-gradient(circle,rgb(255_255_255/0.3),transparent_70%)]" />
      </InteractiveHotspot>

      {/* Plant — Easter egg */}
      <InteractiveHotspot onActivate={() => showEgg(PLANT_MESSAGE)} label="A small plant on the windowsill" position={rectToPositionPercent(PLANT_RECT)} brighten>
        <GlowRegion shape="circle" />
      </InteractiveHotspot>

      {/* Bookshelf — Section 2/3, priority interaction */}
      {bookAssignments.map(({ slot, course, trivia }, i) => (
        <InteractiveBook
          key={i}
          crop={slot}
          imageUrl={HERO_IMAGE}
          course={course ?? undefined}
          trivia={course ? undefined : trivia}
          tiltDeg={slot.tilt}
          onDecorativeClick={showEgg}
        />
      ))}

      {/* Invigilator — Section 8, the most important interactive character */}
      <Invigilator position={INVIGILATOR_RECT} focusCourse={focusCourse} />

      <EasterEggMessage message={eggMessage} position={{ left: "50%", top: "90%" }} />
    </div>
  );
}

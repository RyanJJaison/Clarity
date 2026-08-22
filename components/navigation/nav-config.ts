import {
  BookOpenIcon,
  CalendarIcon,
  ClipboardListIcon,
  HomeIcon,
  InfoIcon,
  SparklesIcon,
  TrendingUpIcon,
  TrophyIcon,
  type LucideIcon,
} from "lucide-react";
import type { Mode } from "@/types/db";

export interface CourseSummary {
  id: string;
  title: string;
  mode: Mode;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown in the compact desktop primary row (not the "More" menu). */
  primary?: boolean;
  /** Shown in the 5-item mobile bottom bar. */
  mobile?: boolean;
  /** Palette-only description shown under the label in the command palette. */
  description?: string;
}

/**
 * Single source of truth for every nav destination — consumed by
 * GlassNavbar (desktop + "more" menu), MobileBottomNav, and CommandPalette,
 * so the three surfaces never drift out of sync.
 *
 * A few destinations (Learn, AI Tools, Progress) resolve against the
 * user's actual course list rather than a fixed route: "AI Tools" opens
 * the tutor chat for the most recently created course, "Learn" jumps to
 * the dashboard's course list, and so on. When there's no course yet they
 * fall back to starting one — never a dead link.
 */
export function buildNavItems(courses: CourseSummary[]): NavItem[] {
  const mostRecent = courses[0];
  const learnHref = mostRecent ? "/dashboard#subjects" : "/courses/new";
  const aiToolsHref = mostRecent ? `/tutor/${mostRecent.id}` : "/courses/new";

  return [
    { id: "home", label: "Home", href: "/dashboard", icon: HomeIcon, primary: true, mobile: true },
    {
      id: "learn",
      label: "Learn",
      href: learnHref,
      icon: BookOpenIcon,
      primary: true,
      mobile: true,
      description: "Your subjects and courses",
    },
    {
      id: "ai-tools",
      label: "AI Tools",
      href: aiToolsHref,
      icon: SparklesIcon,
      primary: true,
      mobile: true,
      description: "Tutor chat, quizzes, and explanations",
    },
    {
      id: "progress",
      label: "Progress",
      href: "/dashboard#mastery",
      icon: TrendingUpIcon,
      primary: true,
      mobile: true,
      description: "Mastery by concept, streak, and reviews",
    },
    {
      id: "assignments",
      label: "Assignments",
      href: "/assignments",
      icon: ClipboardListIcon,
      description: "Upcoming and completed assignments",
    },
    {
      id: "calendar",
      label: "Calendar",
      href: "/schedule",
      icon: CalendarIcon,
      description: "Your study schedule",
    },
    {
      id: "achievements",
      label: "Achievements",
      href: "/achievements",
      icon: TrophyIcon,
      description: "Milestones and badges",
    },
    {
      id: "about",
      label: "About",
      href: "/about",
      icon: InfoIcon,
      description: "What Clarity is and who built it",
    },
  ];
}

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: HomeIcon, primary: true },
  { id: "about", label: "About", href: "/about", icon: InfoIcon, primary: true },
];

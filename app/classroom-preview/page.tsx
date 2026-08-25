"use client";

/**
 * Ported front-end from the "Manus"-built reference repo
 * (github.com/ryansudheer07-hub/clarity-study-platform, client/src/pages/Home.tsx)
 * — real component structure and copy, adapted to run standalone in this
 * Next.js app: no tRPC, no Manus OAuth, no MySQL. Sample data only (the
 * same set shown in the earlier static preview) — NOT wired to this app's
 * real Supabase-backed courses/mastery/attempts. See the banner below.
 *
 * Icons: this project's own lucide-react (already a dependency) instead of
 * hand-drawn SVGs. Motion: this project's `motion/react` (API-compatible
 * successor to the original's framer-motion) instead of adding a new dep.
 */

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BrainIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  Clock3Icon,
  FileTextIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  LightbulbIcon,
  LockIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  NotebookTabsIcon,
  PanelRightIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  TargetIcon,
  UploadIcon,
  UserRoundIcon,
  XIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import "./manus.css";

const navItems: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "classroom", label: "Classroom", icon: LayoutDashboardIcon },
  { id: "plan", label: "Study plan", icon: CalendarDaysIcon },
  { id: "subjects", label: "Subjects", icon: NotebookTabsIcon },
  { id: "resources", label: "Resources", icon: LibraryIcon },
  { id: "progress", label: "Progress", icon: TargetIcon },
  { id: "syllabus", label: "Syllabus", icon: FileTextIcon },
  { id: "practice", label: "Practice", icon: BrainIcon },
  { id: "tests", label: "Upcoming tests", icon: Clock3Icon },
  { id: "settings", label: "Settings", icon: UserRoundIcon },
];

const books = [
  { title: "Modern History", short: "H", color: "#b96b46", topics: "8 topics · 62% ready" },
  { title: "Cognitive Science", short: "C", color: "#708b78", topics: "5 topics · 38% ready" },
  { title: "Spanish", short: "Ñ", color: "#b68e4a", topics: "12 topics · 81% ready" },
  { title: "Data Structures", short: "D", color: "#68758b", topics: "10 topics · 49% ready" },
];

const initialPlan = [
  { time: "09:00", title: "Active recall", detail: "Modern History · The Cold War", duration: "25 min", tone: "rust", done: true },
  { time: "09:30", title: "Practice set", detail: "Data Structures · Trees", duration: "35 min", tone: "blue", done: false },
  { time: "10:15", title: "Concept review", detail: "Spanish · Past tense", duration: "20 min", tone: "gold", done: false },
];

const tests = [
  { name: "History essay", date: "Sep 16", days: "8 days", color: "rust", detail: "Modern History · 4 topics remaining" },
  { name: "Data Structures midterm", date: "Sep 24", days: "16 days", color: "blue", detail: "Data Structures · 7 topics remaining" },
  { name: "Spanish conversation", date: "Oct 02", days: "24 days", color: "gold", detail: "Spanish · 3 topics remaining" },
];

const settingsRows: [string, string][] = [
  ["Study rhythm", "25 minute focus blocks"],
  ["Learning style", "Examples first"],
  ["Weekly check-in", "Sunday evening"],
  ["Private workspace", "Only you can view your materials"],
];

type Book = (typeof books)[number];
type PlanItem = (typeof initialPlan)[number];

function GlassCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`glass-card ${className}`}>
      {children}
    </div>
  );
}

export default function ClassroomPreviewPage() {
  const [active, setActive] = useState("classroom");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showTutor, setShowTutor] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: "assistant" | "user"; text: string }[]>([
    { role: "assistant", text: "Good morning. I've shaped your next session around the topics most likely to move your progress forward." },
  ]);
  const [plan, setPlan] = useState<PlanItem[]>(initialPlan);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [sceneOffset, setSceneOffset] = useState({ x: 0, y: 0 });
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const greeting = "Alex";
  const completion = useMemo(() => Math.round((plan.filter((p) => p.done).length / plan.length) * 100), [plan]);

  function toggleDone(i: number) {
    setPlan((items) => items.map((item, idx) => (idx === i ? { ...item, done: !item.done } : item)));
  }

  function sendMessage() {
    if (!query.trim()) return;
    const current = query.trim();
    setQuery("");
    setMessages((items) => [...items, { role: "user", text: current }]);
    setTimeout(() => {
      setMessages((items) => [
        ...items,
        { role: "assistant", text: "I'm ready to help you work through that. Try breaking the question into one concept, one example, and one thing that still feels unclear." },
      ]);
    }, 500);
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploaded((items) => [...items, ...files.map((f) => f.name)]);
    setShowUpload(false);
  }

  return (
    <div className="manus-root">
      <p className="repro-note">PORTED FRONT END — SAMPLE DATA, NOT CONNECTED TO YOUR REAL CLARITY ACCOUNT</p>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <SparklesIcon size={17} />
            </div>
            <span>clarity</span>
          </div>
          <div className="sidebar-caption">YOUR STUDY SPACE</div>
          <nav>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActive(item.id)} className={`nav-item ${active === item.id ? "active" : ""}`}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {active === item.id && <span className="nav-dot" />}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-caption lower">WORKSPACE</div>
          <button className="nav-item" onClick={() => setShowUpload(true)}>
            <UploadIcon size={17} />
            <span>Upload material</span>
          </button>
          <button className="nav-item" onClick={() => setShowTutor(true)}>
            <MessageCircleIcon size={17} />
            <span>Ask Clarity</span>
          </button>
          <div className="sidebar-footer">
            <div className="mini-streak">
              <ZapIcon size={14} fill="currentColor" />
              <span>
                <strong>5 day</strong> learning streak
              </span>
            </div>
            <div className="profile-row">
              <div className="avatar">{greeting.slice(0, 1)}</div>
              <div>
                <strong>{greeting} Parker</strong>
                <small>Personal workspace</small>
              </div>
              <MoreHorizontalIcon size={17} className="muted" />
            </div>
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div className="mobile-brand">
              <div className="brand-mark">
                <SparklesIcon size={15} />
              </div>{" "}
              clarity
            </div>
            <div className="breadcrumb">
              MY CLASSROOM <span>/</span> {active.toUpperCase()}
            </div>
            <div className="topbar-actions">
              <button className="icon-button">
                <CircleHelpIcon size={18} />
              </button>
              <button className="icon-button">
                <PanelRightIcon size={18} />
              </button>
              <div className="avatar top-avatar">{greeting.slice(0, 1)}</div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="content-wrap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              {active === "classroom" && (
                <>
                  <section className="welcome-row">
                    <div>
                      <p className="eyebrow">TUESDAY, SEPTEMBER 8, 2026</p>
                      <h1>
                        Good morning<span className="sun-dot">.</span>
                      </h1>
                      <p className="subcopy">Ready for today&apos;s study session?</p>
                    </div>
                    <button className="primary-button" onClick={() => setShowPlan(true)}>
                      <PlusIcon size={17} /> Plan a session
                    </button>
                  </section>

                  <section
                    className="classroom-scene"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setSceneOffset({ x: ((e.clientX - rect.left) / rect.width - 0.5) * 2, y: ((e.clientY - rect.top) / rect.height - 0.5) * 2 });
                    }}
                    onMouseLeave={() => setSceneOffset({ x: 0, y: 0 })}
                    style={{ "--scene-x": `${sceneOffset.x}px`, "--scene-y": `${sceneOffset.y}px` } as React.CSSProperties}
                  >
                    <div className="scene-window">
                      <div className="window-sky" />
                      <div className="window-frame vertical" />
                      <div className="window-frame horizontal" />
                      <div className="window-plant">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                    <div className="scene-sun" />
                    <div className="ambient-plant" aria-hidden="true">
                      <div className="pot" />
                      <span />
                      <span />
                      <i />
                      <i className="last" />
                    </div>
                    <div className="scene-label">
                      TODAY IN YOUR CLASSROOM <span>• A QUIET PLACE TO BEGIN</span>
                    </div>

                    <button className="board" onClick={() => setShowPlan(true)}>
                      <div className="board-head">
                        <span>YOUR FOCUS</span>
                        <span>3 tasks</span>
                      </div>
                      <h2>
                        Build your
                        <br />
                        <em>momentum.</em>
                      </h2>
                      <div className="board-line" />
                      <div className="board-task">
                        <span className="board-check">
                          <CheckIcon size={13} />
                        </span>
                        <span>Active recall · History</span>
                        <ChevronRightIcon size={15} />
                      </div>
                      <div className="board-task">
                        <span className="board-check muted-check" />
                        <span>Practice set · Data Structures</span>
                        <ChevronRightIcon size={15} />
                      </div>
                    </button>

                    <div className="bookshelf">
                      <div className="shelf-top" />
                      {books.map((book, index) => (
                        <motion.button
                          key={book.title}
                          whileHover={{ y: -6, x: 8, scale: 1.04, rotate: index % 2 ? 1 : -1, zIndex: 10 }}
                          whileFocus={{ y: -6, x: 8, scale: 1.04, zIndex: 10 }}
                          whileTap={{ scale: 0.98 }}
                          onHoverStart={() => setHoveredBook(book.title)}
                          onHoverEnd={() => setHoveredBook(null)}
                          onFocus={() => setHoveredBook(book.title)}
                          onBlur={() => setHoveredBook(null)}
                          onClick={() => setSelectedBook(book)}
                          className="book"
                          style={{ background: book.color, height: `${104 + index * 7}px` }}
                          aria-label={`Open ${book.title} subject workspace`}
                        >
                          <span className="book-title">{book.short}</span>
                          <small>{book.title}</small>
                        </motion.button>
                      ))}
                      {hoveredBook && (
                        <div className="book-tooltip">
                          <strong>{hoveredBook.toUpperCase()}</strong>
                          <span>{books.find((b) => b.title === hoveredBook)?.topics}</span>
                        </div>
                      )}
                      <div className="shelf-bottom" />
                    </div>

                    <div className="desk">
                      <div className="desk-top" />
                      <div className="desk-leg left" />
                      <div className="desk-leg right" />
                      <button className="open-book" onClick={() => setShowPlan(true)} aria-label="Open current study session">
                        <span>next</span>
                        <strong>session</strong>
                        <small>click to begin</small>
                      </button>
                      <div className="mug">
                        <div className="mug-handle" />
                      </div>
                      <div className="pencil-pot">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>

                    <button className="computer" onClick={() => setShowTutor(true)} aria-label="Open Ask Clarity tutor">
                      <div className="screen">
                        <div className="screen-glow" />
                        <SparklesIcon size={18} />
                        <span>Ask anything</span>
                      </div>
                      <div className="monitor-neck" />
                      <div className="monitor-base" />
                    </button>
                  </section>

                  <section className="below-grid">
                    <GlassCard className="focus-card">
                      <div className="card-heading">
                        <div>
                          <p className="eyebrow">NEXT UP</p>
                          <h3>Your study plan</h3>
                        </div>
                        <button className="text-button" onClick={() => setShowPlan(true)}>
                          View full plan <ArrowRightIcon size={15} />
                        </button>
                      </div>
                      <div className="plan-summary">
                        <div className="ring" style={{ "--progress": `${completion * 3.6}deg` } as React.CSSProperties}>
                          <span>{completion}%</span>
                        </div>
                        <div>
                          <strong>
                            {plan.filter((p) => p.done).length} of {plan.length} sessions complete
                          </strong>
                          <p>One focused block at a time. You&apos;re on a good pace.</p>
                        </div>
                      </div>
                      <div className="micro-progress">
                        <span style={{ width: `${completion}%` }} />
                      </div>
                    </GlassCard>
                    <GlassCard className="deadline-card">
                      <div className="deadline-icon">
                        <CalendarDaysIcon size={18} />
                      </div>
                      <div>
                        <p className="eyebrow">NEXT MILESTONE</p>
                        <h3>History essay</h3>
                        <p className="muted-copy">
                          Due in <strong>8 days</strong> · 4 topics remaining
                        </p>
                      </div>
                      <button className="round-arrow" onClick={() => setActive("plan")}>
                        <ArrowRightIcon size={16} />
                      </button>
                    </GlassCard>
                  </section>
                </>
              )}

              {active === "plan" && <PlanView plan={plan} onToggle={toggleDone} completion={completion} onTutor={() => setShowTutor(true)} />}
              {active === "subjects" && <SubjectsView onSelect={setSelectedBook} onSyllabus={() => setActive("syllabus")} />}
              {active === "resources" && <ResourcesView uploaded={uploaded} onUpload={() => setShowUpload(true)} />}
              {active === "progress" && <ProgressView completion={completion} />}
              {active === "syllabus" && <SyllabusView onUpload={() => setShowUpload(true)} />}
              {active === "practice" && <PracticeView onTutor={() => setShowTutor(true)} />}
              {active === "tests" && <TestsView />}
              {active === "settings" && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {selectedBook && (
          <Modal onClose={() => setSelectedBook(null)} title="SUBJECT WORKSPACE">
            <div className="subject-modal-head" style={{ background: selectedBook.color }}>
              <span>{selectedBook.short}</span>
              <div>
                <p>SUBJECT WORKSPACE</p>
                <h2>{selectedBook.title}</h2>
              </div>
            </div>
            <p className="modal-copy">A calm place to collect your syllabus, resources, notes, and practice for this subject.</p>
            <div className="modal-stat-grid">
              <div>
                <strong>{selectedBook.topics.split(" · ")[0]}</strong>
                <span>in syllabus</span>
              </div>
              <div>
                <strong>{selectedBook.topics.split(" · ")[1]}</strong>
                <span>coverage</span>
              </div>
            </div>
            <button
              className="primary-button full"
              onClick={() => {
                setSelectedBook(null);
                setActive("subjects");
              }}
            >
              Open workspace <ArrowRightIcon size={16} />
            </button>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutor && (
          <Modal onClose={() => setShowTutor(false)} title="ASK CLARITY">
            <div className="tutor-header">
              <div className="tutor-orb">
                <SparklesIcon size={22} />
              </div>
              <div>
                <p className="eyebrow">YOUR AI STUDY COMPANION</p>
                <h2>Let&apos;s untangle it.</h2>
              </div>
            </div>
            <div className="chat-thread">
              {messages.map((message, index) => (
                <div key={index} className={`chat-bubble ${message.role}`}>
                  {message.text}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about a concept, mistake, or next step…"
              />
              <button onClick={sendMessage}>
                <SendIcon size={16} />
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpload && (
          <Modal onClose={() => setShowUpload(false)} title="ADD LEARNING MATERIAL">
            <div className="upload-zone" onClick={() => uploadRef.current?.click()}>
              <div className="upload-cloud">
                <UploadIcon size={21} />
              </div>
              <h3>Drop a document into your classroom</h3>
              <p>PDF, DOCX, TXT, or image files</p>
              <button className="secondary-button">Choose file</button>
              <input ref={uploadRef} type="file" hidden multiple accept=".pdf,.docx,.txt,image/*" onChange={onFiles} />
            </div>
            <p className="modal-note">
              <LockIcon size={13} /> Your material stays private to your workspace.
            </p>
            {uploaded.length > 0 && (
              <div className="uploaded-list">
                {uploaded.map((file) => (
                  <div key={file}>
                    <FileTextIcon size={15} /> {file}
                    <CheckIcon size={15} />
                  </div>
                ))}
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlan && (
          <Modal onClose={() => setShowPlan(false)} title="PLAN A SESSION">
            <PlanView plan={plan} onToggle={toggleDone} completion={completion} onTutor={() => { setShowPlan(false); setShowTutor(true); }} compact />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanView({
  plan,
  onToggle,
  completion,
  onTutor,
  compact = false,
}: {
  plan: PlanItem[];
  onToggle: (i: number) => void;
  completion: number;
  onTutor: () => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "compact-plan" : "page-view"}>
      {!compact && (
        <div className="page-view-header">
          <div>
            <p className="eyebrow">TUESDAY · 8 SEPTEMBER</p>
            <h2>Today&apos;s study plan</h2>
            <p className="subcopy">A focused 80 minutes, sequenced around your priorities.</p>
          </div>
          <button className="secondary-button" onClick={onTutor}>
            <BrainIcon size={16} /> Ask for guidance
          </button>
        </div>
      )}
      <div className="daily-bar">
        <span>DAILY CAPACITY</span>
        <strong>1h 20m</strong>
        <div className="daily-track">
          <span style={{ width: "62%" }} />
        </div>
        <small>{completion}% planned</small>
      </div>
      <div className="timeline">
        {plan.map((item, index) => (
          <div className={`timeline-item ${item.done ? "is-done" : ""}`} key={item.title}>
            <div className="timeline-time">{item.time}</div>
            <div className={`timeline-node ${item.tone}`} onClick={() => onToggle(index)}>
              {item.done ? <CheckIcon size={14} /> : <span />}
            </div>
            <div className="timeline-card">
              <div>
                <p className="eyebrow">{item.title}</p>
                <h3>{item.detail}</h3>
                <span>
                  <Clock3Icon size={14} /> {item.duration}
                </span>
              </div>
              <button className="round-arrow">
                <ArrowRightIcon size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="plan-insight">
        <LightbulbIcon size={17} />
        <p>
          <strong>Why this order?</strong> Your history essay is closest, while tree traversal is a recurring weak spot. Clarity put momentum first, then depth.
        </p>
      </div>
    </div>
  );
}

function SubjectsView({ onSelect, onSyllabus }: { onSelect: (book: Book) => void; onSyllabus: () => void }) {
  return (
    <div className="page-view">
      <div className="page-view-header">
        <div>
          <p className="eyebrow">YOUR CURRICULUM</p>
          <h2>Subjects that move with you</h2>
          <p className="subcopy">Organize every course, topic, and goal in one quiet workspace.</p>
        </div>
        <button className="primary-button">
          <PlusIcon size={16} /> Add subject
        </button>
      </div>
      <div className="subject-grid">
        {books.map((book) => (
          <GlassCard key={book.title} className="subject-card" onClick={() => onSelect(book)}>
            <div className="subject-swatch" style={{ background: book.color }}>
              {book.short}
            </div>
            <div>
              <h3>{book.title}</h3>
              <p>{book.topics}</p>
            </div>
            <ChevronRightIcon size={17} />
          </GlassCard>
        ))}
      </div>
      <GlassCard className="syllabus-banner">
        <div className="banner-icon">
          <FileTextIcon size={20} />
        </div>
        <div>
          <p className="eyebrow">SYLLABUS WORKSPACE</p>
          <h3>Turn a course outline into a clear path.</h3>
          <p>Upload a syllabus and Clarity will map chapters, topics, and the relationships between them.</p>
        </div>
        <button className="secondary-button" onClick={onSyllabus}>
          Open syllabus <ArrowRightIcon size={15} />
        </button>
      </GlassCard>
    </div>
  );
}

function ResourcesView({ uploaded, onUpload }: { uploaded: string[]; onUpload: () => void }) {
  const files = uploaded.length ? uploaded : ["Cold War timeline notes.txt", "Spanish verbs · practice set.pdf", "Data Structures · lecture 04.pdf"];
  const subjects = ["Modern History", "Spanish", "Data Structures"];
  return (
    <div className="page-view">
      <div className="page-view-header">
        <div>
          <p className="eyebrow">LEARNING LIBRARY</p>
          <h2>Everything you need, close at hand</h2>
          <p className="subcopy">Review notes, readings, and course documents beside the topics they support.</p>
        </div>
        <button className="primary-button" onClick={onUpload}>
          <UploadIcon size={16} /> Add material
        </button>
      </div>
      <div className="resource-grid">
        <GlassCard className="resource-feature">
          <div className="resource-art">
            <BookOpenIcon size={30} />
          </div>
          <div>
            <p className="eyebrow">RECENTLY ADDED</p>
            <h3>{uploaded[0] ?? "History essay brief.pdf"}</h3>
            <p>Modern History · Documents</p>
          </div>
          <button className="text-button">
            Review <ArrowRightIcon size={15} />
          </button>
        </GlassCard>
        <GlassCard className="resource-feature soft">
          <div className="resource-art">
            <LightbulbIcon size={30} />
          </div>
          <div>
            <p className="eyebrow">CLARITY PICK</p>
            <h3>Tree traversal, explained</h3>
            <p>Data Structures · Recommended</p>
          </div>
          <button className="text-button">
            Open <ArrowRightIcon size={15} />
          </button>
        </GlassCard>
      </div>
      <div className="section-label">YOUR MATERIALS</div>
      <div className="file-list">
        {files.map((file, index) => (
          <div className="file-row" key={file}>
            <div className="file-icon">
              <FileTextIcon size={16} />
            </div>
            <div>
              <strong>{file}</strong>
              <span>{subjects[index] ?? "Personal notes"}</span>
            </div>
            <MoreHorizontalIcon size={17} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressView({ completion }: { completion: number }) {
  const bars = [34, 54, 42, 76, 62, 88, 48];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="page-view">
      <div className="page-view-header">
        <div>
          <p className="eyebrow">YOUR MOMENTUM</p>
          <h2>Progress you can feel</h2>
          <p className="subcopy">Small, consistent sessions are adding up across your subjects.</p>
        </div>
        <div className="streak-pill">
          <ZapIcon size={16} fill="currentColor" /> 5 day streak
        </div>
      </div>
      <div className="progress-overview">
        <GlassCard>
          <p className="eyebrow">THIS WEEK</p>
          <div className="big-number">4h 35m</div>
          <p className="muted-copy">focused learning time</p>
          <div className="bars">
            {bars.map((h, i) => (
              <div key={i} className="bar-wrap">
                <div className={i === 5 ? "bar active" : "bar"} style={{ height: `${h}%` }} />
                <span>{days[i]}</span>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <p className="eyebrow">SUBJECT MOMENTUM</p>
          <div className="momentum-row">
            <span className="momentum-dot rust" />
            <div>
              <strong>Modern History</strong>
              <small>Moving steadily</small>
            </div>
            <b>62%</b>
          </div>
          <div className="momentum-row">
            <span className="momentum-dot blue" />
            <div>
              <strong>Data Structures</strong>
              <small>Needs a little care</small>
            </div>
            <b>49%</b>
          </div>
          <div className="momentum-row">
            <span className="momentum-dot gold" />
            <div>
              <strong>Spanish</strong>
              <small>In a great rhythm</small>
            </div>
            <b>81%</b>
          </div>
        </GlassCard>
      </div>
      <GlassCard className="milestone">
        <div className="milestone-icon">
          <GraduationCapIcon size={22} />
        </div>
        <div>
          <p className="eyebrow">NEXT MILESTONE</p>
          <h3>Complete 5 focused sessions</h3>
          <p className="muted-copy">You&apos;re {completion ? "one session" : "getting started"} away from your next Clarity mark.</p>
        </div>
        <div className="milestone-progress">
          <strong>4 / 5</strong>
          <div>
            <span />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function SyllabusView({ onUpload }: { onUpload: () => void }) {
  const topics = [
    ["Origins & key tensions", "Ready to revisit", true],
    ["Proxy conflicts", "Ready to revisit", true],
    ["Primary source analysis", "In progress", false],
    ["Essay synthesis", "Up next", false],
  ] as const;
  return (
    <div className="page-view">
      <div className="page-view-header">
        <div>
          <p className="eyebrow">STRUCTURED SYLLABUS</p>
          <h2>See the path, not just the pile.</h2>
          <p className="subcopy">Clarity has turned your course outline into a map of topics, goals, and next steps.</p>
        </div>
        <button className="primary-button" onClick={onUpload}>
          <UploadIcon size={16} /> Import outline
        </button>
      </div>
      <div className="syllabus-columns">
        <GlassCard>
          <p className="eyebrow">MODERN HISTORY</p>
          <h3 className="workspace-title">The Cold War</h3>
          {topics.map(([topic, status, checked]) => (
            <div className="topic-row" key={topic}>
              <span className={`topic-status ${checked ? "checked" : ""}`}>{checked && <CheckIcon size={12} />}</span>
              <div>
                <strong>{topic}</strong>
                <small>{status}</small>
              </div>
              <ChevronRightIcon size={15} />
            </div>
          ))}
        </GlassCard>
        <GlassCard>
          <p className="eyebrow">YOUR GOAL</p>
          <h3 className="workspace-title">Write with evidence.</h3>
          <p className="muted-copy">Finish one timed response before Friday, using two primary sources to support your argument.</p>
          <div className="goal-progress">
            <span style={{ width: "68%" }} />
          </div>
          <div className="goal-foot">
            <span>68% complete</span>
            <button className="text-button">Edit goal</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function PracticeView({ onTutor }: { onTutor: () => void }) {
  const [choice, setChoice] = useState("");
  const answers = ["Pre-order", "In-order", "Post-order", "Breadth-first"];
  return (
    <div className="page-view">
      <div className="page-view-header">
        <div>
          <p className="eyebrow">GUIDED PRACTICE · DATA STRUCTURES</p>
          <h2>Learn by trying.</h2>
          <p className="subcopy">One question, one useful explanation, no pressure to get it right first.</p>
        </div>
        <button className="secondary-button" onClick={onTutor}>
          <MessageCircleIcon size={16} /> Ask Clarity
        </button>
      </div>
      <GlassCard className="practice-card">
        <div className="practice-kicker">
          <span>QUESTION 2 OF 5</span>
          <span>MEDIUM</span>
        </div>
        <h3>Which traversal visits a binary search tree&apos;s values in sorted order?</h3>
        <div className="answer-grid">
          {answers.map((answer) => (
            <button key={answer} className={`answer-option ${choice === answer ? "selected" : ""}`} onClick={() => setChoice(answer)}>
              <span>{answer.slice(0, 1)}</span>
              {answer}
            </button>
          ))}
        </div>
        {choice && (
          <div className="answer-feedback">
            <CheckIcon size={16} />
            <p>
              <strong>Good instinct.</strong> In-order traversal visits the left subtree, node, then right subtree — which preserves sorted order in a
              BST.
            </p>
          </div>
        )}
        <button className="primary-button" onClick={() => setChoice("")}>
          Next question <ArrowRightIcon size={16} />
        </button>
      </GlassCard>
    </div>
  );
}

function TestsView() {
  return (
    <div className="page-view">
      <div className="page-view-header">
        <div>
          <p className="eyebrow">DEADLINES & MILESTONES</p>
          <h2>Know what&apos;s coming.</h2>
          <p className="subcopy">Your plan gets smarter when your deadlines are visible.</p>
        </div>
        <button className="primary-button">
          <PlusIcon size={16} /> Add assessment
        </button>
      </div>
      <div className="test-list">
        {tests.map((test) => (
          <GlassCard className="test-row" key={test.name}>
            <div className={`test-date ${test.color}`}>
              <strong>{test.date.split(" ")[1]}</strong>
              <span>{test.date.split(" ")[0]}</span>
            </div>
            <div>
              <h3>{test.name}</h3>
              <p>{test.detail}</p>
            </div>
            <div className="test-days">
              <strong>{test.days}</strong>
              <span>to go</span>
            </div>
            <ChevronRightIcon size={16} />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="page-view">
      <div className="page-view-header">
        <div>
          <p className="eyebrow">YOUR SPACE</p>
          <h2>Make Clarity yours.</h2>
          <p className="subcopy">A few thoughtful preferences keep your study environment aligned.</p>
        </div>
      </div>
      <GlassCard className="settings-card">
        {settingsRows.map(([label, value]) => (
          <div className="setting-row" key={label}>
            <div className="setting-icon">
              <SparklesIcon size={15} />
            </div>
            <div>
              <strong>{label}</strong>
              <span>{value}</span>
            </div>
            <button className="secondary-button">Change</button>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-top">
          <span>{title}</span>
          <button className="close-button" onClick={onClose}>
            <XIcon size={17} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

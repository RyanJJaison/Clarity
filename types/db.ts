// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once the project is linked,
// and replace this file with the generated output.

export type Mode = "general" | "exam" | "language";
export type Level = "beginner" | "intermediate" | "advanced";
export type SourceType = "pdf" | "url" | "youtube" | "text";

/**
 * The full study-activity menu — not every subject uses every type. The AI
 * selects among these based on the content and the student's per-dimension
 * mastery (lib/prompts/quizGen.ts); the app never assumes a fixed subset.
 */
export type ItemType =
  | "mcq"
  | "short_answer"
  | "fill_blank"
  | "essay"
  | "source_analysis"
  | "comparative_analysis"
  | "timeline"
  | "teach_back"
  | "discussion"
  | "coding_exercise"
  | "vocabulary"
  | "flashcard"
  | "mock_exam";

/**
 * How an activity gets scored, decoupled from what kind of activity it is:
 * - exact: string-equality grading (mcq)
 * - ai_boolean: today's default — AI judges right/wrong (short_answer, fill_blank)
 * - ai_rubric: AI scores multiple dimensions (essay, source_analysis, ...) —
 *   see DimensionScore
 * - reflection: no correctness at all (teach_back, discussion) — feedback only,
 *   never penalizes mastery
 */
export type GradingMode = "exact" | "ai_boolean" | "ai_rubric" | "reflection";

export interface DimensionScore {
  dimension: string; // e.g. "recall", "analysis", "structure"
  score: number; // 0-1
  note?: string;
}

export type ChatRole = "user" | "assistant";

export interface OutlineLesson {
  id: string;
  title: string;
  conceptTags: string[];
}

export interface OutlineModule {
  title: string;
  lessons: OutlineLesson[];
}

export interface CourseOutline {
  modules: OutlineModule[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          default_level: Level | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      content_sources: {
        Row: {
          id: string;
          user_id: string;
          type: SourceType;
          title: string;
          raw_text: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["content_sources"]["Row"]> & {
          user_id: string;
          type: SourceType;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_sources"]["Row"]>;
      };
      content_chunks: {
        Row: {
          id: string;
          source_id: string;
          chunk_text: string;
          embedding: number[] | null;
          position: number;
        };
        Insert: Partial<Database["public"]["Tables"]["content_chunks"]["Row"]> & {
          source_id: string;
          chunk_text: string;
          position: number;
        };
        Update: Partial<Database["public"]["Tables"]["content_chunks"]["Row"]>;
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          source_id: string | null;
          mode: Mode;
          title: string;
          outline: CourseOutline | null;
          exam_date: string | null;
          target_language: string | null;
          proficiency_level: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> & {
          user_id: string;
          mode: Mode;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
      };
      quiz_items: {
        Row: {
          id: string;
          course_id: string;
          lesson_id: string | null;
          question: string;
          item_type: ItemType;
          options: string[] | null;
          answer: string;
          explanation: string | null;
          concept_tag: string | null;
          difficulty: number;
          grading_mode: GradingMode;
          rubric_dimensions: string[] | null;
        };
        Insert: Partial<Database["public"]["Tables"]["quiz_items"]["Row"]> & {
          course_id: string;
          question: string;
          item_type: ItemType;
          answer: string;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_items"]["Row"]>;
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_item_id: string;
          correct: boolean;
          response_text: string | null;
          difficulty_at_attempt: number | null;
          dimension_scores: DimensionScore[] | null;
          feedback: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["attempts"]["Row"]> & {
          user_id: string;
          quiz_item_id: string;
          correct: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Row"]>;
      };
      srs_cards: {
        Row: {
          id: string;
          user_id: string;
          quiz_item_id: string;
          ease_factor: number;
          interval_days: number;
          repetitions: number;
          due_date: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["srs_cards"]["Row"]> & {
          user_id: string;
          quiz_item_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["srs_cards"]["Row"]>;
      };
      mastery: {
        Row: {
          user_id: string;
          course_id: string;
          concept_tag: string;
          /** Defaults to "overall" — pre-migration rows and simple exact/ai_boolean
           *  grading still only ever write this one dimension. */
          dimension: string;
          mastery_score: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["mastery"]["Row"]> & {
          user_id: string;
          course_id: string;
          concept_tag: string;
        };
        Update: Partial<Database["public"]["Tables"]["mastery"]["Row"]>;
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          role: ChatRole;
          content: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]> & {
          user_id: string;
          course_id: string;
          role: ChatRole;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]>;
      };
    };
  };
}

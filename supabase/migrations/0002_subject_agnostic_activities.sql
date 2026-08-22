-- Subject-agnostic study activities: broadens quiz_items beyond mcq/short_answer/
-- fill_blank, decouples "what kind of activity" from "how it's graded", and lets
-- mastery hold more than one dimension per concept (e.g. recall vs. analysis).
--
-- Fully additive and backward-compatible: every new column has a default that
-- reproduces today's behavior exactly, so existing rows and every already-shipped
-- feature (quiz grading, SRS, exam readiness, dashboard mastery) keeps working
-- unchanged until the application code is updated to use the new columns (done in
-- a follow-up change, not this migration).

-- ---------------------------------------------------------------------------
-- quiz_items: broaden the activity-type menu, add a grading strategy and
-- optional rubric dimensions the activity is meant to assess.
-- ---------------------------------------------------------------------------
alter table quiz_items drop constraint quiz_items_item_type_check;
alter table quiz_items add constraint quiz_items_item_type_check
  check (item_type in (
    'mcq', 'short_answer', 'fill_blank',           -- existing types, unchanged
    'essay', 'source_analysis', 'comparative_analysis',
    'timeline', 'teach_back', 'discussion',
    'coding_exercise', 'vocabulary', 'flashcard', 'mock_exam'
  ));

alter table quiz_items add column grading_mode text
  check (grading_mode in ('exact', 'ai_boolean', 'ai_rubric', 'reflection'))
  not null default 'ai_boolean';

-- mcq items already use exact-match grading in application code; backfill for
-- consistency so grading_mode is a reliable source of truth going forward.
update quiz_items set grading_mode = 'exact' where item_type = 'mcq';

-- e.g. ["recall","analysis"] -- optional; most simple items won't set this.
alter table quiz_items add column rubric_dimensions text[];

-- ---------------------------------------------------------------------------
-- attempts: multi-dimensional scoring alongside the existing boolean, plus
-- attempt-specific AI feedback (item.explanation is the same for everyone;
-- this is what the AI said about *this* response).
-- ---------------------------------------------------------------------------
alter table attempts add column dimension_scores jsonb; -- [{ dimension, score, note }]
alter table attempts add column feedback text;

-- ---------------------------------------------------------------------------
-- mastery: one row per (user, course, concept) becomes one row per
-- (user, course, concept, dimension). Existing rows default to 'overall',
-- identical in meaning to what they already represented.
-- ---------------------------------------------------------------------------
alter table mastery add column dimension text not null default 'overall';
alter table mastery drop constraint mastery_pkey;
alter table mastery add primary key (user_id, course_id, concept_tag, dimension);

create extension if not exists vector;

create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  default_level text check (default_level in ('beginner','intermediate','advanced')),
  created_at timestamptz default now()
);

create table content_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  type text check (type in ('pdf','url','youtube','text')) not null,
  title text not null,
  raw_text text,
  created_at timestamptz default now()
);

create table content_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references content_sources(id) on delete cascade,
  chunk_text text not null,
  embedding vector(1024),   -- match Voyage model output dimension
  position int not null
);
create index on content_chunks using ivfflat (embedding vector_cosine_ops);

-- Cosine-similarity top-k search scoped to a single content source, used by
-- the tutor chat RAG pipeline (lib/rag.ts, app/api/tutor/chat/route.ts).
create or replace function match_content_chunks(
  query_embedding vector(1024),
  match_source_id uuid,
  match_count int default 5
)
returns table (chunk_text text, similarity float)
language sql stable
as $$
  select chunk_text, 1 - (embedding <=> query_embedding) as similarity
  from content_chunks
  where source_id = match_source_id
  order by embedding <=> query_embedding
  limit match_count;
$$;

create table courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  source_id uuid references content_sources(id),
  mode text check (mode in ('general','exam','language')) not null,
  title text not null,
  outline jsonb,             -- [{ moduleTitle, lessons: [{ id, title, conceptTags }] }]
  exam_date date,
  target_language text,
  proficiency_level text,
  created_at timestamptz default now()
);

create table quiz_items (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  lesson_id text,
  question text not null,
  item_type text check (item_type in ('mcq','short_answer','fill_blank')) not null,
  options jsonb,             -- for mcq
  answer text not null,
  explanation text,
  concept_tag text,
  difficulty int check (difficulty between 1 and 5) not null default 3
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  quiz_item_id uuid references quiz_items(id) on delete cascade,
  correct boolean not null,
  response_text text,
  difficulty_at_attempt int,
  created_at timestamptz default now()
);

create table srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  quiz_item_id uuid references quiz_items(id) on delete cascade,
  ease_factor numeric default 2.5,
  interval_days int default 0,
  repetitions int default 0,
  due_date date default current_date,
  updated_at timestamptz default now(),
  unique (user_id, quiz_item_id)
);

create table mastery (
  user_id uuid references auth.users(id) not null,
  course_id uuid references courses(id) on delete cascade,
  concept_tag text not null,
  mastery_score numeric default 0,   -- 0..1
  updated_at timestamptz default now(),
  primary key (user_id, course_id, concept_tag)
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  course_id uuid references courses(id) on delete cascade,
  role text check (role in ('user','assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- Row Level Security: every table above restricts rows to auth.uid() = user_id
-- (or the equivalent join through courses/quiz_items).

alter table profiles enable row level security;
alter table content_sources enable row level security;
alter table content_chunks enable row level security;
alter table courses enable row level security;
alter table quiz_items enable row level security;
alter table attempts enable row level security;
alter table srs_cards enable row level security;
alter table mastery enable row level security;
alter table chat_messages enable row level security;

create policy "profiles: owner read/write" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "content_sources: owner read/write" on content_sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "content_chunks: owner read/write via source" on content_chunks
  for all using (
    exists (select 1 from content_sources s where s.id = content_chunks.source_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from content_sources s where s.id = content_chunks.source_id and s.user_id = auth.uid())
  );

create policy "courses: owner read/write" on courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quiz_items: owner read/write via course" on quiz_items
  for all using (
    exists (select 1 from courses c where c.id = quiz_items.course_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = quiz_items.course_id and c.user_id = auth.uid())
  );

create policy "attempts: owner read/write" on attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "srs_cards: owner read/write" on srs_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mastery: owner read/write" on mastery
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chat_messages: owner read/write" on chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

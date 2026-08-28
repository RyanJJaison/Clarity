-- Hybrid retrieval for the tutor chat RAG pipeline.
--
-- Vector search alone misses exact-term questions ("what are Okazaki
-- fragments?") where the embedding is diffuse but the keyword is decisive, while
-- full-text search alone misses paraphrases. This adds Postgres full-text
-- search alongside the existing pgvector search and fuses the two rankings with
-- Reciprocal Rank Fusion.
--
-- RRF combines ranked lists using rank position only, so it never has to put
-- cosine similarity and ts_rank — which have incomparable scales — onto a common
-- scale. rrf_k = 60 is the standard constant from Cormack et al.
--
-- match_content_chunks (vector-only) is intentionally left in place: it is still
-- referenced elsewhere and is the fallback if hybrid retrieval regresses.

-- Generated tsvector column. STORED (not virtual) so the GIN index can be built
-- on it, and generated so it can never drift from chunk_text the way a
-- trigger-maintained column can.
alter table content_chunks
  add column if not exists chunk_tsv tsvector
  generated always as (to_tsvector('english', coalesce(chunk_text, ''))) stored;

create index if not exists content_chunks_chunk_tsv_idx
  on content_chunks using gin (chunk_tsv);

-- Supports the source-scoped filter both search arms apply before ranking.
create index if not exists content_chunks_source_id_idx
  on content_chunks (source_id);

create or replace function match_content_chunks_hybrid(
  query_embedding vector(1024),
  query_text text,
  match_source_id uuid,
  match_count int default 5,
  candidate_count int default 20,
  rrf_k int default 60
)
returns table (chunk_text text, similarity float)
language sql
stable
as $$
  with
  -- websearch_to_tsquery tolerates arbitrary user input (it will not raise on
  -- punctuation or stray operators the way to_tsquery does), which matters
  -- because query_text is whatever the student typed.
  parsed_query as (
    select websearch_to_tsquery('english', coalesce(query_text, '')) as tsq
  ),
  vector_hits as (
    select
      c.id,
      row_number() over (order by c.embedding <=> query_embedding) as rank,
      1 - (c.embedding <=> query_embedding) as similarity
    from content_chunks c
    where c.source_id = match_source_id
      and c.embedding is not null
    order by c.embedding <=> query_embedding
    limit candidate_count
  ),
  keyword_hits as (
    select
      c.id,
      row_number() over (
        order by ts_rank(c.chunk_tsv, pq.tsq) desc, c.id
      ) as rank
    from content_chunks c
    cross join parsed_query pq
    where c.source_id = match_source_id
      -- An empty tsquery matches nothing, so a query of only stopwords or
      -- punctuation yields zero keyword hits and the fusion below degrades to
      -- vector-only ranking rather than erroring.
      and pq.tsq is not null
      and pq.tsq != ''::tsquery
      and c.chunk_tsv @@ pq.tsq
    order by ts_rank(c.chunk_tsv, pq.tsq) desc, c.id
    limit candidate_count
  ),
  -- Full outer join: a chunk found by only one arm still competes, it just
  -- collects a single reciprocal-rank term instead of two.
  fused as (
    select
      coalesce(v.id, k.id) as id,
      coalesce(1.0 / (rrf_k + v.rank), 0.0)
        + coalesce(1.0 / (rrf_k + k.rank), 0.0) as score,
      v.similarity,
      v.rank as vector_rank
    from vector_hits v
    full outer join keyword_hits k on k.id = v.id
  )
  select
    c.chunk_text,
    -- Report the vector similarity so callers keep a comparable, interpretable
    -- number. A keyword-only hit has no cosine similarity to report; 0.0 marks
    -- it rather than inventing a value.
    coalesce(f.similarity, 0.0)::float as similarity
  from fused f
  join content_chunks c on c.id = f.id
  -- vector_rank breaks score ties deterministically and keeps the ordering
  -- stable when the keyword arm returns nothing at all.
  order by f.score desc, f.vector_rank nulls last, c.id
  limit match_count;
$$;

comment on function match_content_chunks_hybrid is
  'Hybrid vector + full-text retrieval over content_chunks, fused with Reciprocal Rank Fusion. Falls back to vector-only ordering when the full-text query matches nothing.';

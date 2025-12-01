-- Enable pgvector extension (if not already enabled)
create extension if not exists vector;
create extension if not exists pgcrypto;

-- Law chunks table
create table if not exists public.law_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb not null,
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Indexes for metadata fields (optional)
create index if not exists law_chunks_created_at_idx on public.law_chunks (created_at desc);
create index if not exists law_chunks_metadata_gin_idx on public.law_chunks using gin (metadata);

-- RPC function: match_law_chunks
-- Uses cosine distance to find nearest neighbors above a threshold
drop function if exists public.match_law_chunks(vector, double precision, integer);

create or replace function public.match_law_chunks(
  query_embedding vector,
  match_threshold double precision,
  match_count integer
) returns setof public.law_chunks as $$
  select *
  from public.law_chunks
  where 1 - (public.law_chunks.embedding <=> query_embedding) >= match_threshold
  order by public.law_chunks.embedding <=> query_embedding
  limit match_count;
$$ language sql stable;

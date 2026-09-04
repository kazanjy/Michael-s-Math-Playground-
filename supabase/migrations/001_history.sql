-- Session history: one row per practice session
create table sessions (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  theme text not null,
  custom_theme text,
  grade_level text not null,
  mode text not null,            -- 'questions' | 'time'
  end_mode text not null,        -- 'chill' | 'race'
  question_count int,
  time_limit_minutes int,
  total_xp int not null default 0,
  correct_count int not null default 0,
  incorrect_count int not null default 0,
  best_streak int not null default 0,
  elapsed_time_ms bigint not null default 0,
  created_at timestamptz not null default now()
);

-- Question history: one row per answered question
create table question_history (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  child_id text not null,
  question_text text not null,
  correct_answer text not null,
  user_answer text not null,
  is_correct boolean not null,
  genre text not null,           -- math concept: addition, multiplication, fractions, etc.
  explanation text,
  time_spent_ms int not null,
  attempts int not null default 1,
  scratchpad_url text,           -- Supabase Storage URL for the scratchpad image
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_sessions_child on sessions(child_id, created_at desc);
create index idx_qh_child_genre on question_history(child_id, genre, created_at desc);
create index idx_qh_session on question_history(session_id);

-- Storage bucket for scratchpad images
insert into storage.buckets (id, name, public)
values ('scratchpads', 'scratchpads', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload scratchpad images
create policy "Users can upload scratchpads"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'scratchpads');

-- Allow public read access to scratchpad images
create policy "Public read access for scratchpads"
  on storage.objects for select
  to public
  using (bucket_id = 'scratchpads');

-- RLS policies for sessions
alter table sessions enable row level security;

create policy "Users can insert their own sessions"
  on sessions for insert
  to authenticated
  with check (true);

create policy "Users can read their own sessions"
  on sessions for select
  to authenticated
  using (true);

-- RLS policies for question_history
alter table question_history enable row level security;

create policy "Users can insert question history"
  on question_history for insert
  to authenticated
  with check (true);

create policy "Users can read question history"
  on question_history for select
  to authenticated
  using (true);

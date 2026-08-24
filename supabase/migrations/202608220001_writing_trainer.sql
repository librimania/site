create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  access_code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.exam_task_types (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  name text not null,
  description text,
  min_word_count int,
  max_word_count int,
  rubric_key text,
  sort_order int not null default 0,
  unique (exam_id, name)
);

create table if not exists public.writing_topics (
  id uuid primary key default gen_random_uuid(),
  exam_task_type_id uuid not null references public.exam_task_types(id) on delete cascade,
  name text not null,
  cover_image_url text,
  sort_order int not null default 0,
  unique (exam_task_type_id, name)
);

create table if not exists public.writing_prompts (
  id uuid primary key default gen_random_uuid(),
  writing_topic_id uuid not null references public.writing_topics(id) on delete cascade,
  title text not null,
  task_number text,
  task_text text not null,
  task_instructions text[] not null default '{}',
  structure_note text,
  score_points int,
  is_published boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.writing_prompt_exercises (
  id uuid primary key default gen_random_uuid(),
  writing_prompt_id uuid not null references public.writing_prompts(id) on delete cascade,
  stage text not null check (stage in ('vocabulary', 'linking_words')),
  exercise_order int not null,
  type text not null check (type in ('fill_blank', 'multiple_choice', 'matching', 'sequence', 'true_false')),
  prompt text,
  data jsonb not null default '{}',
  unique (writing_prompt_id, stage, exercise_order)
);

create table if not exists public.student_writing_exercise_answers (
  student_id uuid not null references public.students(id) on delete cascade,
  exercise_id uuid not null references public.writing_prompt_exercises(id) on delete cascade,
  answer_data jsonb,
  is_correct boolean,
  attempted_at timestamptz not null default now(),
  primary key (student_id, exercise_id)
);

create table if not exists public.essay_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  writing_prompt_id uuid not null references public.writing_prompts(id) on delete cascade,
  submitted_text text not null,
  word_count int not null,
  submitted_at timestamptz not null default now(),
  ai_feedback jsonb,
  ai_score numeric,
  grading_status text not null default 'pending' check (grading_status in ('pending', 'complete', 'failed')),
  grading_error text,
  teacher_reviewed boolean not null default false,
  teacher_notes text,
  reviewed_at timestamptz
);

create index if not exists writing_topics_parent_idx on public.writing_topics(exam_task_type_id, sort_order);
create index if not exists writing_prompts_parent_idx on public.writing_prompts(writing_topic_id, sort_order);
create index if not exists essay_submissions_queue_idx on public.essay_submissions(teacher_reviewed, submitted_at desc);

insert into public.exams (name, sort_order) values
  ('BAC', 10), ('IELTS', 20), ('Cambridge', 30)
on conflict (name) do update set sort_order = excluded.sort_order;

insert into public.exam_task_types (exam_id, name, description, min_word_count, max_word_count, rubric_key, sort_order)
select id, 'Essay Writing', 'Subiectul II — аргументированное эссе.', 180, 200, 'bac_subiectul_2', 10 from public.exams where name = 'BAC'
on conflict (exam_id, name) do update set description=excluded.description, min_word_count=excluded.min_word_count, max_word_count=excluded.max_word_count, rubric_key=excluded.rubric_key, sort_order=excluded.sort_order;

insert into public.exam_task_types (exam_id, name, description, min_word_count, max_word_count, rubric_key, sort_order)
select id, 'Article', 'Subiectul III — статья.', 90, 100, 'bac_subiectul_3', 20 from public.exams where name = 'BAC'
on conflict (exam_id, name) do update set description=excluded.description, min_word_count=excluded.min_word_count, max_word_count=excluded.max_word_count, rubric_key=excluded.rubric_key, sort_order=excluded.sort_order;

alter table public.students enable row level security;
alter table public.exams enable row level security;
alter table public.exam_task_types enable row level security;
alter table public.writing_topics enable row level security;
alter table public.writing_prompts enable row level security;
alter table public.writing_prompt_exercises enable row level security;
alter table public.student_writing_exercise_answers enable row level security;
alter table public.essay_submissions enable row level security;

create or replace function public.is_teacher() returns boolean language sql stable security definer set search_path = public as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'librimaniastore@gmail.com'
$$;

drop policy if exists "published exams readable" on public.exams;
create policy "published exams readable" on public.exams for select using (true);
drop policy if exists "task types readable" on public.exam_task_types;
create policy "task types readable" on public.exam_task_types for select using (true);
drop policy if exists "topics readable" on public.writing_topics;
create policy "topics readable" on public.writing_topics for select using (true);
drop policy if exists "published prompts readable" on public.writing_prompts;
create policy "published prompts readable" on public.writing_prompts for select using (is_published or public.is_teacher());
drop policy if exists "exercises readable" on public.writing_prompt_exercises;
create policy "exercises readable" on public.writing_prompt_exercises for select using (true);

drop policy if exists "student reads self" on public.students;
create policy "student reads self" on public.students for select using (auth.uid() = auth_user_id or public.is_teacher());
drop policy if exists "student answers self" on public.student_writing_exercise_answers;
create policy "student answers self" on public.student_writing_exercise_answers for all using (
  exists (select 1 from public.students s where s.id = student_id and s.auth_user_id = auth.uid()) or public.is_teacher()
) with check (
  exists (select 1 from public.students s where s.id = student_id and s.auth_user_id = auth.uid()) or public.is_teacher()
);
drop policy if exists "student submissions self" on public.essay_submissions;
create policy "student submissions self" on public.essay_submissions for select using (
  exists (select 1 from public.students s where s.id = student_id and s.auth_user_id = auth.uid()) or public.is_teacher()
);
drop policy if exists "student inserts submission" on public.essay_submissions;
create policy "student inserts submission" on public.essay_submissions for insert with check (
  exists (select 1 from public.students s where s.id = student_id and s.auth_user_id = auth.uid())
);

drop policy if exists "teacher manages exams" on public.exams;
create policy "teacher manages exams" on public.exams for all using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists "teacher manages task types" on public.exam_task_types;
create policy "teacher manages task types" on public.exam_task_types for all using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists "teacher manages topics" on public.writing_topics;
create policy "teacher manages topics" on public.writing_topics for all using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists "teacher manages prompts" on public.writing_prompts;
create policy "teacher manages prompts" on public.writing_prompts for all using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists "teacher manages exercises" on public.writing_prompt_exercises;
create policy "teacher manages exercises" on public.writing_prompt_exercises for all using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists "teacher manages students" on public.students;
create policy "teacher manages students" on public.students for all using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists "teacher reviews submissions" on public.essay_submissions;
create policy "teacher reviews submissions" on public.essay_submissions for update using (public.is_teacher()) with check (public.is_teacher());

grant usage on schema public to anon, authenticated;
grant select on public.exams, public.exam_task_types, public.writing_topics, public.writing_prompts, public.writing_prompt_exercises to anon, authenticated;
grant select, insert, update on public.student_writing_exercise_answers, public.essay_submissions to authenticated;
grant select on public.students to authenticated;


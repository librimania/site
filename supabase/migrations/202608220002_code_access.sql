create or replace function public.claim_student_access(student_code text)
returns table (id uuid, name text, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  matched public.students%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication session required';
  end if;
  select * into matched from public.students
  where upper(access_code) = upper(trim(student_code)) and active = true
  for update;
  if not found then raise exception 'Invalid or inactive student code'; end if;
  if matched.auth_user_id is not null and matched.auth_user_id <> auth.uid() then
    raise exception 'This code is already connected to another device';
  end if;
  update public.students set auth_user_id = auth.uid() where students.id = matched.id;
  return query select matched.id, matched.name, matched.email;
end;
$$;

revoke all on function public.claim_student_access(text) from public;
grant execute on function public.claim_student_access(text) to authenticated;

drop policy if exists "student updates own pending submission" on public.essay_submissions;
create policy "student updates own pending submission" on public.essay_submissions for update using (
  exists (select 1 from public.students s where s.id = student_id and s.auth_user_id = auth.uid())
) with check (
  exists (select 1 from public.students s where s.id = student_id and s.auth_user_id = auth.uid())
);


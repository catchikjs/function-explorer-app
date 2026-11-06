-- Run once in a NEW Supabase project's SQL editor. Accounts and memberships
-- are provisioned by the school administrator; browsers cannot grant roles.
create table public.class_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 class_id text not null,
 class_name text not null,
 display_name text not null check (length(display_name) between 1 and 80),
 role text not null check (role in ('student','teacher'))
);
create table public.learning_records (
 user_id uuid primary key references public.class_members(user_id) on delete cascade,
 class_id text not null,
 payload jsonb not null,
 version integer not null default 1,
 updated_at timestamptz not null default now()
);
create table public.teacher_messages (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references public.class_members(user_id),
 recipient_id uuid not null references public.class_members(user_id),
 class_id text not null,
 text text not null check(length(text) between 1 and 3000),
 created_at timestamptz not null default now()
);
create index on public.learning_records(class_id);
create index on public.teacher_messages(recipient_id,created_at desc);
alter table public.class_members enable row level security;
alter table public.learning_records enable row level security;
alter table public.teacher_messages enable row level security;

create function public.my_class_id() returns text language sql stable security definer set search_path='' as $$
 select class_id from public.class_members where user_id=auth.uid();
$$;
create function public.is_class_teacher(p_class text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.class_members where user_id=auth.uid() and class_id=p_class and role='teacher');
$$;
revoke all on function public.my_class_id() from public;
revoke all on function public.is_class_teacher(text) from public;
grant execute on function public.my_class_id(), public.is_class_teacher(text) to authenticated;

create policy members_read on public.class_members for select to authenticated
 using (user_id=auth.uid() or public.is_class_teacher(class_id));
create policy records_read on public.learning_records for select to authenticated
 using (user_id=auth.uid() or public.is_class_teacher(class_id));
create policy messages_read on public.teacher_messages for select to authenticated
 using (recipient_id=auth.uid() or (teacher_id=auth.uid() and public.is_class_teacher(class_id)));
create policy messages_send on public.teacher_messages for insert to authenticated
 with check (teacher_id=auth.uid() and public.is_class_teacher(class_id)
 and exists(select 1 from public.class_members m where m.user_id=recipient_id and m.class_id=teacher_messages.class_id));
-- No direct browser writes to memberships or records. The RPC below checks
-- identity, class membership and optimistic version in a single transaction.
revoke all on public.class_members, public.learning_records, public.teacher_messages from anon;
revoke insert,update,delete on public.class_members,public.learning_records from authenticated;
revoke update,delete on public.teacher_messages from authenticated;
grant select on public.class_members,public.learning_records,public.teacher_messages to authenticated;
grant insert on public.teacher_messages to authenticated;

create function public.save_learning_record(p_payload jsonb,p_expected_version integer) returns integer
 language plpgsql security definer set search_path='' as $$
 declare v_class text; v_version integer;
 begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  select class_id into v_class from public.class_members where user_id=auth.uid();
  if v_class is null then raise exception 'MEMBERSHIP_REQUIRED'; end if;
  if p_payload is null or (p_payload->>'schema') is distinct from '1' or jsonb_typeof(p_payload->'state') is distinct from 'object'
   or octet_length(p_payload::text)>8000000 then raise exception 'INVALID_RECORD'; end if;
  -- Serialize first inserts too, so two devices cannot both claim version zero.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  select version into v_version from public.learning_records where user_id=auth.uid() for update;
  if coalesce(v_version,0) is distinct from p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
  v_version:=coalesce(v_version,0)+1;
  insert into public.learning_records(user_id,class_id,payload,version,updated_at)
   values(auth.uid(),v_class,p_payload,v_version,now())
   on conflict(user_id) do update set payload=excluded.payload,class_id=excluded.class_id,version=excluded.version,updated_at=excluded.updated_at;
  return v_version;
 end;
$$;
revoke all on function public.save_learning_record(jsonb,integer) from public;
grant execute on function public.save_learning_record(jsonb,integer) to authenticated;

-- ADMIN ONLY, after creating users in Authentication > Users:
-- insert into public.class_members(user_id,class_id,class_name,display_name,role)
-- values ('AUTH-USER-UUID','school-2026-1-1','1학년 1반','김학생','student');
-- The teacher uses the SAME class_id and role='teacher'.

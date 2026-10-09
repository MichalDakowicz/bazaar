-- Run in the Supabase Dashboard SQL Editor before shipping General list mode.
-- Also included at the end of schema.sql. Safe to run again; no list is moved
-- or renamed, and the default keeps the current separate-list home.
alter table public.bazaar_settings
  add column if not exists general_list boolean not null default false;
alter table public.bazaar_settings
  add column if not exists general_list_id uuid
  references public.bazaar_lists(id) on delete set null;
create index if not exists bazaar_settings_general_list_idx
  on public.bazaar_settings (general_list_id) where general_list_id is not null;

-- Invoker permissions preserve existing membership and account-owner RLS.
-- Locking the account settings serializes simultaneous switches on two devices.
create or replace function public.bazaar_set_list_mode(
  p_enabled boolean,
  p_name text default 'General list',
  p_app_lang text default 'en',
  p_product_lang text default 'en'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_list uuid;
  v_only uuid;
  v_count bigint;
begin
  if v_user is null or p_enabled is null then
    raise exception 'Sign in before changing list mode.';
  end if;

  insert into public.bazaar_settings (user_id, app_lang, product_lang)
  values (
    v_user,
    case when p_app_lang = 'pl' then 'pl' else 'en' end,
    case when p_product_lang = 'pl' then 'pl' else 'en' end
  ) on conflict (user_id) do nothing;

  select general_list_id into v_list from public.bazaar_settings
  where user_id = v_user for update;

  if not p_enabled then
    update public.bazaar_settings set general_list = false where user_id = v_user;
    return v_list;
  end if;

  -- A former target may have been deleted, archived or no longer shared with me.
  if v_list is not null and not exists (
    select 1 from public.bazaar_lists where id = v_list and archived_at is null
  ) then
    v_list := null;
  end if;

  if v_list is null then
    -- RLS limits this to lists the caller can see, including a shared sole list.
    select count(*), min(id::text)::uuid into v_count, v_only
    from public.bazaar_lists where archived_at is null;
    if v_count = 1 then
      v_list := v_only;
    else
      insert into public.bazaar_lists (owner_id, name, position)
      values (v_user, left(coalesce(nullif(btrim(p_name), ''), 'General list'), 60), 0)
      returning id into v_list;
    end if;
  end if;

  update public.bazaar_settings
  set general_list = true, general_list_id = v_list where user_id = v_user;
  return v_list;
end;
$$;
revoke all on function public.bazaar_set_list_mode(boolean, text, text, text) from public;
grant execute on function public.bazaar_set_list_mode(boolean, text, text, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bazaar_settings'
     ) then
    alter publication supabase_realtime add table public.bazaar_settings;
  end if;
end $$;

create extension if not exists pgcrypto;

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text unique not null,
  customer_name text,
  status text not null default 'active' check (status in ('active','revoked')),
  device_id text,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  notes text
);

create index if not exists licenses_status_idx on public.licenses(status);
create index if not exists licenses_created_at_idx on public.licenses(created_at desc);
alter table public.licenses enable row level security;

drop policy if exists "admin read licenses" on public.licenses;
create policy "admin read licenses" on public.licenses for select to authenticated using (true);
drop policy if exists "admin insert licenses" on public.licenses;
create policy "admin insert licenses" on public.licenses for insert to authenticated with check (true);
drop policy if exists "admin update licenses" on public.licenses;
create policy "admin update licenses" on public.licenses for update to authenticated using (true) with check (true);

create or replace function public.activate_license(p_license_key text,p_device_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v licenses%rowtype;
begin
  select * into v from public.licenses where license_key=upper(trim(p_license_key)) for update;
  if not found then return jsonb_build_object('ok',false,'message','كود التفعيل غير موجود.'); end if;
  if v.status<>'active' then return jsonb_build_object('ok',false,'message','هذا الكود ملغى.'); end if;
  if v.device_id is not null and v.device_id<>p_device_id then return jsonb_build_object('ok',false,'message','هذا الكود مفعّل بالفعل على جهاز آخر.'); end if;
  if v.device_id is null then update public.licenses set device_id=p_device_id,activated_at=now() where id=v.id; end if;
  return jsonb_build_object('ok',true,'message','تم التفعيل بنجاح.');
end; $$;

revoke all on function public.activate_license(text,text) from public;
grant execute on function public.activate_license(text,text) to anon, authenticated;

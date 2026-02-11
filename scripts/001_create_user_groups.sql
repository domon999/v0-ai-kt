-- 创建用户组表
create table if not exists public.user_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- 插入默认用户组
insert into public.user_groups (name, is_default)
values ('普通用户', true)
on conflict do nothing;

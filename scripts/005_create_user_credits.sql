-- 创建用户积分表
create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  credits decimal(10, 4) not null default 0,
  total_credits decimal(10, 4) not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 创建索引
create index if not exists idx_user_credits_user on public.user_credits(user_id);

-- 启用 RLS
alter table public.user_credits enable row level security;

-- RLS 策略：用户只能查看自己的积分
create policy "users_view_own_credits" on public.user_credits
  for select using (user_id = auth.uid());

-- RLS 策略：管理员可以查看所有用户积分
create policy "admins_view_all_credits" on public.user_credits
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

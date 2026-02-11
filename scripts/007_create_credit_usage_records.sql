-- 创建消费记录表
create table if not exists public.credit_usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  type text not null,
  amount decimal(10, 4) not null,
  balance_after decimal(10, 4),
  description text,
  created_at timestamp with time zone default now()
);

-- 创建索引
create index if not exists idx_credit_usage_user on public.credit_usage_records(user_id);
create index if not exists idx_credit_usage_created on public.credit_usage_records(created_at desc);

-- 启用 RLS
alter table public.credit_usage_records enable row level security;

-- RLS 策略：用户可以查看自己的消费记录
create policy "users_view_own_usage_records" on public.credit_usage_records
  for select using (user_id = auth.uid());

-- RLS 策略：管理员可以查看所有消费记录
create policy "admins_view_all_usage_records" on public.credit_usage_records
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

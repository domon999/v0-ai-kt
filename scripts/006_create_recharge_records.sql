-- 创建充值记录表
create table if not exists public.recharge_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  credits decimal(10, 4) not null,
  amount decimal(10, 2) default 0,
  card_code text,
  payment_method text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 创建索引
create index if not exists idx_recharge_records_user on public.recharge_records(user_id);
create index if not exists idx_recharge_records_status on public.recharge_records(status);
create index if not exists idx_recharge_records_created on public.recharge_records(created_at desc);

-- 启用 RLS
alter table public.recharge_records enable row level security;

-- RLS 策略：用户可以查看自己的充值记录
create policy "users_view_own_recharge_records" on public.recharge_records
  for select using (user_id = auth.uid());

-- RLS 策略：管理员可以查看所有充值记录
create policy "admins_view_all_recharge_records" on public.recharge_records
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

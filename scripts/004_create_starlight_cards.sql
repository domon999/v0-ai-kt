-- 创建星光卡表
create table if not exists public.starlight_cards (
  id uuid primary key default gen_random_uuid(),
  card_code text unique not null,
  points decimal(10, 4) not null default 0,
  status text not null default 'available' check (status in ('available', 'used', 'expired')),
  used_by uuid references auth.users(id),
  used_at timestamp with time zone,
  prefix text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- 约束：已使用的卡必须有使用者
  constraint used_cards_must_have_user check (
    (status = 'used' and used_by is not null) or status != 'used'
  )
);

-- 创建索引
create index if not exists idx_starlight_cards_status on public.starlight_cards(status);
create index if not exists idx_starlight_cards_used_by on public.starlight_cards(used_by);
create index if not exists idx_starlight_cards_card_code on public.starlight_cards(card_code);

-- 启用 RLS
alter table public.starlight_cards enable row level security;

-- RLS 策略：管理员可以管理所有卡密
create policy "admins_manage_all_cards" on public.starlight_cards
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- RLS 策略：用户可以查看自己已使用的卡密
create policy "users_view_own_used_cards" on public.starlight_cards
  for select using (used_by = auth.uid());

-- RLS 策略：任何人都可以查询可用卡密（用于验证）
create policy "anyone_check_available_cards" on public.starlight_cards
  for select using (status = 'available');

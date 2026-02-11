-- 创建 profiles 表
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  user_group_id uuid references public.user_groups(id) on delete set null,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 启用 RLS (Row Level Security)
alter table public.profiles enable row level security;

-- RLS 策略：用户可以查看自己的资料
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- RLS 策略：管理员可以查看所有资料
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- RLS 策略：用户可以更新自己的资料
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS 策略：管理员可以更新所有资料
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

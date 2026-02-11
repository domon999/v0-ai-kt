-- 用户注册时自动创建 profile 记录
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_group_id uuid;
begin
  -- 获取默认用户组
  select id into default_group_id
  from public.user_groups
  where is_default = true
  limit 1;

  -- 插入新用户的 profile
  insert into public.profiles (id, email, user_group_id)
  values (
    new.id,
    new.email,
    default_group_id
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 创建触发器
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

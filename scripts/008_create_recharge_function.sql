-- 创建充值函数（原子性充值 + 账号绑定）
create or replace function public.recharge_with_card(
  p_card_code text,
  p_user_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card record;
  v_user_credits record;
  v_new_balance decimal(10, 4);
  v_now timestamp with time zone;
begin
  v_now := now();
  
  -- 1. 查询卡密（加行锁防止并发）
  select * into v_card
  from starlight_cards
  where card_code = trim(p_card_code)
  for update;
  
  if not found then
    return json_build_object(
      'success', false,
      'error', '星光卡不存在'
    );
  end if;
  
  -- 2. 检查卡密状态和账号绑定
  if v_card.status = 'used' then
    if v_card.used_by = p_user_id then
      return json_build_object(
        'success', false,
        'error', '您已使用过该卡密'
      );
    else
      return json_build_object(
        'success', false,
        'error', '该卡密已被其他用户使用',
        'used_at', v_card.used_at
      );
    end if;
  end if;
  
  if v_card.status != 'available' then
    return json_build_object(
      'success', false,
      'error', '该星光卡已失效'
    );
  end if;
  
  -- 3. 更新卡密状态（绑定用户）
  update starlight_cards
  set 
    status = 'used',
    used_by = p_user_id,
    used_at = v_now,
    updated_at = v_now
  where id = v_card.id;
  
  -- 4. 获取用户当前积分
  select * into v_user_credits
  from user_credits
  where user_id = p_user_id
  for update;
  
  -- 5. 更新或创建用户积分
  if found then
    v_new_balance := round((v_user_credits.credits + v_card.points)::numeric, 4);
    
    update user_credits
    set 
      credits = v_new_balance,
      total_credits = round((total_credits + v_card.points)::numeric, 4),
      updated_at = v_now
    where user_id = p_user_id;
  else
    v_new_balance := round(v_card.points::numeric, 4);
    
    insert into user_credits (user_id, credits, total_credits, created_at, updated_at)
    values (p_user_id, v_new_balance, v_new_balance, v_now, v_now);
  end if;
  
  -- 6. 创建充值记录
  insert into recharge_records (
    user_id, credits, amount, card_code, payment_method, status, completed_at, created_at, updated_at
  ) values (
    p_user_id, v_card.points, 0, trim(p_card_code), 'starlight_card', 'completed', v_now, v_now, v_now
  );
  
  -- 7. 创建消费记录
  insert into credit_usage_records (user_id, type, amount, balance_after, description, created_at)
  values (
    p_user_id,
    '充值',
    v_card.points,
    v_new_balance,
    '星光卡充值: ' || coalesce(v_card.prefix, '') || '****',
    v_now
  );
  
  -- 8. 返回成功结果
  return json_build_object(
    'success', true,
    'points', v_card.points,
    'new_balance', v_new_balance,
    'message', '充值成功！获得 ' || v_card.points || ' 星光点'
  );
  
exception when others then
  return json_build_object(
    'success', false,
    'error', '充值失败: ' || sqlerrm
  );
end;
$$;

-- 授予执行权限
grant execute on function public.recharge_with_card to authenticated;

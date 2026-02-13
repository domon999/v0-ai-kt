-- 创建 Banana API 配置表
CREATE TABLE IF NOT EXISTS public.banana_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 配置名称（区分多个接口）
  config_name VARCHAR(100) NOT NULL DEFAULT 'default',
  
  -- API 配置
  api_key TEXT NOT NULL,
  base_url TEXT NOT NULL DEFAULT 'https://www.blueshirtmap.com/v1/chat/completions',
  model_key TEXT NOT NULL DEFAULT 'gemini-3-pro-image-preview',
  
  -- 启用状态和优先级
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1, -- 1=主力, 2=备用, 3=第三备用
  
  -- 使用统计
  total_requests INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE,
  last_error_at TIMESTAMP WITH TIME ZONE,
  last_error_message TEXT,
  
  -- 配置说明
  notes TEXT,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_banana_config_name ON banana_config(config_name);

-- 创建优先级索引
CREATE INDEX IF NOT EXISTS idx_banana_priority ON banana_config(priority) WHERE is_active = true;

-- 启用 RLS
ALTER TABLE public.banana_config ENABLE ROW LEVEL SECURITY;

-- RLS 策略：任何人都可以读取活跃的配置
DROP POLICY IF EXISTS "Anyone can read active banana config" ON public.banana_config;
CREATE POLICY "Anyone can read active banana config"
  ON public.banana_config
  FOR SELECT
  USING (is_active = true);

-- RLS 策略：只有管理员可以管理配置
DROP POLICY IF EXISTS "Only admins can manage banana config" ON public.banana_config;
CREATE POLICY "Only admins can manage banana config"
  ON public.banana_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 初始化数据（主力 + 备用接口）
INSERT INTO public.banana_config (config_name, api_key, base_url, model_key, is_active, priority, notes) VALUES
  ('primary', '', 'https://www.blueshirtmap.com/v1/chat/completions', 'gemini-3-pro-image-preview', true, 1, '主力接口 - 请在管理后台配置 API Key'),
  ('backup', '', 'https://gap.blueshirtmap.com/v1/chat/completions', 'gemini-3-pro-image-preview', true, 2, '备用接口 - 请在管理后台配置 API Key')
ON CONFLICT (config_name) DO NOTHING;

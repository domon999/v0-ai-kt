-- 创建 banana_config 表（简化版）
CREATE TABLE IF NOT EXISTS banana_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  base_url TEXT NOT NULL DEFAULT 'https://www.blueshirtmap.com/v1/chat/completions',
  model_key TEXT NOT NULL DEFAULT 'gemini-3-pro-image-preview',
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  success_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_banana_config_priority ON banana_config(priority);
CREATE INDEX IF NOT EXISTS idx_banana_config_is_active ON banana_config(is_active);

-- 启用 RLS
ALTER TABLE banana_config ENABLE ROW LEVEL SECURITY;

-- 允许管理员完全访问
CREATE POLICY "Allow admin full access to banana_config"
ON banana_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

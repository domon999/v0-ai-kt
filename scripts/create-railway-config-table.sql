-- 创建 railway_config 表
CREATE TABLE IF NOT EXISTS railway_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name TEXT NOT NULL,
  api_base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 添加注释
COMMENT ON TABLE railway_config IS 'Railway VEO 3.1 API 配置表';
COMMENT ON COLUMN railway_config.config_name IS '配置名称';
COMMENT ON COLUMN railway_config.api_base_url IS 'Railway API 基础 URL';
COMMENT ON COLUMN railway_config.api_key IS 'API 密钥';
COMMENT ON COLUMN railway_config.is_active IS '是否激活';
COMMENT ON COLUMN railway_config.priority IS '优先级（数字越小优先级越高）';
COMMENT ON COLUMN railway_config.success_count IS '成功次数统计';
COMMENT ON COLUMN railway_config.fail_count IS '失败次数统计';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_railway_config_active_priority 
  ON railway_config(is_active, priority);

-- 启用 RLS
ALTER TABLE railway_config ENABLE ROW LEVEL SECURITY;

-- 管理员完全访问策略
CREATE POLICY "管理员完全访问 railway_config"
  ON railway_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- 普通用户只读策略
CREATE POLICY "用户读取激活的 railway_config"
  ON railway_config
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- MiniMax 语音服务数据库表
-- 包含：API配置、克隆声音、生成音频、任务追踪

-- 1. API 配置表
CREATE TABLE IF NOT EXISTS minimax_voice_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,           -- 'minimax-official', 'minimax-backup', etc.
  api_key TEXT NOT NULL,                   -- JWT Token
  group_id TEXT,                           -- Group ID（如需要）
  api_endpoint TEXT NOT NULL DEFAULT 'https://api.minimaxi.com',
  
  -- 功能配置
  enabled BOOLEAN DEFAULT true,            -- 是否启用
  priority INTEGER NOT NULL,               -- 优先级（1=主力，2=备用）
  
  -- 限制配置
  max_requests_per_day INTEGER,           -- 每日请求限制
  max_concurrent_requests INTEGER,        -- 并发限制
  
  -- 统计数据
  total_requests INTEGER DEFAULT 0,       -- 总请求数
  success_requests INTEGER DEFAULT 0,     -- 成功请求数
  failed_requests INTEGER DEFAULT 0,      -- 失败请求数
  last_used_at TIMESTAMP,                 -- 最后使用时间
  last_error TEXT,                        -- 最后错误信息
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_provider UNIQUE(provider)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_minimax_configs_enabled ON minimax_voice_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_minimax_configs_priority ON minimax_voice_configs(priority);

-- 2. 克隆声音记录表
CREATE TABLE IF NOT EXISTS minimax_cloned_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 声音信息
  name VARCHAR(255) NOT NULL,             -- 声音名称
  voice_id VARCHAR(255) NOT NULL,         -- Voice ID
  file_id TEXT,                           -- 原始文件ID
  
  -- 配置参数
  need_noise_reduction BOOLEAN DEFAULT false,
  need_volume_normalization BOOLEAN DEFAULT false,
  
  -- 文件信息
  input_file_url TEXT,                    -- 上传的音频URL
  demo_audio_url TEXT,                    -- 预览音频URL
  
  -- 元数据
  provider VARCHAR(50) DEFAULT 'minimax-official',
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_user_voice_id UNIQUE(user_id, voice_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cloned_voices_user ON minimax_cloned_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_cloned_voices_voice_id ON minimax_cloned_voices(voice_id);

-- RLS 策略
ALTER TABLE minimax_cloned_voices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cloned voices" ON minimax_cloned_voices;
CREATE POLICY "Users can view own cloned voices" ON minimax_cloned_voices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own cloned voices" ON minimax_cloned_voices;
CREATE POLICY "Users can create own cloned voices" ON minimax_cloned_voices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cloned voices" ON minimax_cloned_voices;
CREATE POLICY "Users can delete own cloned voices" ON minimax_cloned_voices
  FOR DELETE USING (auth.uid() = user_id);

-- 3. 生成音频记录表
CREATE TABLE IF NOT EXISTS minimax_generated_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 任务信息
  text TEXT NOT NULL,                     -- 输入文本
  voice_id VARCHAR(255) NOT NULL,         -- 使用的声音ID
  voice_name VARCHAR(255),                -- 声音名称（显示用）
  model VARCHAR(100),                     -- 使用的模型
  
  -- 音频信息
  audio_url TEXT NOT NULL,                -- 生成的音频URL
  duration FLOAT,                         -- 音频时长（秒）
  
  -- 配置参数
  speed FLOAT DEFAULT 1.0,
  volume FLOAT DEFAULT 1.0,
  pitch INTEGER DEFAULT 0,
  
  -- 元数据
  provider VARCHAR(50) DEFAULT 'minimax-official',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_generated_audio_user ON minimax_generated_audio(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_audio_created ON minimax_generated_audio(created_at DESC);

-- RLS 策略
ALTER TABLE minimax_generated_audio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generated audio" ON minimax_generated_audio;
CREATE POLICY "Users can view own generated audio" ON minimax_generated_audio
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own generated audio" ON minimax_generated_audio;
CREATE POLICY "Users can create own generated audio" ON minimax_generated_audio
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own generated audio" ON minimax_generated_audio;
CREATE POLICY "Users can delete own generated audio" ON minimax_generated_audio
  FOR DELETE USING (auth.uid() = user_id);

-- 4. 任务追踪表
CREATE TABLE IF NOT EXISTS voice_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 任务类型
  task_type VARCHAR(50) NOT NULL,         -- 'clone' 或 'synthesis'
  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'success', 'failed'
  
  -- 任务详情
  voice_id VARCHAR(255),
  voice_name VARCHAR(255),
  text TEXT,
  model VARCHAR(100),
  
  -- 文件引用
  input_file_url TEXT,
  output_file_url TEXT,
  
  -- 错误追踪
  error_message TEXT,
  error_code VARCHAR(100),
  
  -- 元数据
  provider VARCHAR(50) DEFAULT 'minimax-official',
  request_params JSONB,
  response_data JSONB,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_voice_tasks_user ON voice_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_status ON voice_tasks(status);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_type ON voice_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_created ON voice_tasks(created_at DESC);

-- RLS 策略
ALTER TABLE voice_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tasks" ON voice_tasks;
CREATE POLICY "Users can view own tasks" ON voice_tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all tasks" ON voice_tasks;
CREATE POLICY "Admins can view all tasks" ON voice_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

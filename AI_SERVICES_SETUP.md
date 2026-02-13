# AI 服务配置指南

本文档说明系统需要的所有 AI 服务配置信息。

## 🔴 需要提供的 API 配置

### 1. Banana API（图生图 - 数字人生成）

**功能：** 将用户上传的照片生成数字人形象

**需要提供：**
- API Base URL: `https://xxx.banana.dev/`
- API Key: `sk_xxx`
- 具体的 endpoint 路径
- 请求参数格式示例
- 响应数据格式示例

**请求示例（需确认）：**
```json
POST /generate
{
  "image": "base64_encoded_image",
  "model": "digital_human_v1"
}
```

**响应示例（需确认）：**
```json
{
  "success": true,
  "image_url": "https://...",
  "task_id": "xxx"
}
```

---

### 2. Railway API（视频生成和延长）

**功能：** 生成16秒数字人视频，延长到32秒

**需要提供：**
- API Base URL: `https://xxx.railway.app/`
- API Key/Token
- 生成视频 endpoint: `POST /generate`
- 延长视频 endpoint: `POST /extend`
- 查询任务 endpoint: `GET /task/{id}`
- 请求参数格式
- 响应数据格式
- 任务状态类型（pending/processing/completed/failed）

**生成视频请求示例（需确认）：**
```json
POST /generate
{
  "image_url": "https://...",
  "duration": 16
}
```

**响应示例（需确认）：**
```json
{
  "task_id": "xxx",
  "status": "pending"
}
```

---

### 3. MiniMax API（声音克隆 + TTS）

**功能：** 克隆用户声音，文字转语音

**需要提供：**
- API Base URL
- Group ID
- API Key
- 声音克隆 endpoint 和参数
- TTS 合成 endpoint 和参数
- 支持的音频格式
- API 文档链接

**声音克隆请求示例（需确认）：**
```json
POST /voice/clone
{
  "audio_url": "https://...",
  "duration": 10
}
```

**TTS 请求示例（需确认）：**
```json
POST /tts
{
  "text": "要合成的文本",
  "voice_id": "cloned_voice_xxx",
  "speed": 1.0
}
```

---

### 4. DreamFace API（唇同步）

**功能：** 视频唇形与音频同步

**需要提供：**
- API Base URL: `https://dreamface.railway.internal/`
- Token 池（至少 3-5 个 token）
- 提交任务 endpoint: `POST /sync`
- 查询任务 endpoint: `GET /task/{id}`
- 请求参数格式
- 响应数据格式
- 任务轮询间隔建议

**提交任务请求示例（需确认）：**
```json
POST /sync
{
  "video_url": "https://...",
  "audio_url": "https://...",
  "token": "xxx"
}
```

**响应示例（需确认）：**
```json
{
  "task_id": "xxx",
  "status": "processing",
  "progress": 0
}
```

---

## 📝 配置步骤

1. 收集所有 API 的完整信息
2. 在管理后台 `/glht/api` 页面配置各服务的 API 信息
3. 测试每个服务的连接性
4. 开始实现具体的业务逻辑

## 🔧 当前状态

- ✅ 数据库表结构已创建（各服务的配置表）
- ✅ 管理后台配置页面已完成
- ✅ Service 层代码框架已创建
- ❌ API endpoint 实现（等待配置信息）
- ❌ 前端调用集成（等待 API 实现）

## 📞 下一步

请提供以上 4 个 AI 服务的完整配置信息，包括：
- API URL
- 认证方式（API Key/Token）
- 具体的请求/响应格式
- API 文档链接（如有）

配置信息到位后，我将立即实现所有 API endpoint 和业务逻辑。

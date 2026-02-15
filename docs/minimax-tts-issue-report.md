# MiniMax TTS 问题报告

## 问题概述

在 `/minimax1` 页面和 `/wd/sy` 页面使用 MiniMax TTS 功能时，API 调用失败，返回 500 错误。

## 错误信息

### 控制台错误
```
POST https://v0-ai-kt.vercel.app/api/minimax/tts 500 (Internal Server Error)
```

### 服务器返回的错误详情
```json
{
  "error": "invalid params, no voice_id found"
}
```

### 前端错误堆栈
```
Error: 服务器未返回任务ID
    at handleAsyncCreate (app/minimax1/page.tsx:182:15)
```

## 问题分析

MiniMax API 返回错误提示 `no voice_id found`，表明请求参数中缺少或格式错误的 `voice_id` 字段。

### 当前实现位置

1. **TTS API 路由**：`/app/api/minimax/tts/route.ts`
2. **TTS 服务类**：`/lib/services/minimax-tts-service.ts`
3. **前端页面**：
   - `/app/minimax1/page.tsx`（测试页面）
   - `/components/wd/sy/tts-panel.tsx`（生产页面）

## 当前请求格式

根据 `/lib/services/minimax-tts-service.ts` 中的实现：

```typescript
const requestBody = {
  model: model || 'speech-2.8-hd',
  text,
  ...(config.group_id && { GroupID: config.group_id }),
  voice_setting: {
    voice_id: voiceId,
    speed: speed || 1.0,
    vol: volume || 10,
    pitch: pitch || 0,
  },
  audio_setting: {
    audio_sample_rate: 32000,
    bitrate: 128000,
    format: 'mp3',
    channel: 2,
  },
}
```

## MiniMax 官方 API 规范

根据官方文档 `2同步语音合成.txt` 和 `3异步语音合成.txt`：

### API 端点
- **同步合成**：`POST https://api.minimaxi.com/v1/t2a_v2`
- **异步合成**：`POST https://api.minimaxi.com/v1/t2a_v2_async`

### 请求头
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

### 请求体结构（官方示例）
```json
{
  "GroupID": "your_group_id",
  "model": "speech-2.8-hd",
  "text": "你好，欢迎使用语音合成服务",
  "voice_setting": {
    "voice_id": "male-qn-qingse",
    "speed": 1.0,
    "vol": 10,
    "pitch": 0
  },
  "audio_setting": {
    "sample_rate": 32000,
    "bitrate": 128000,
    "format": "mp3",
    "channel": 2
  }
}
```

## 差异对比

| 字段 | 当前实现 | 官方文档 | 状态 |
|------|---------|---------|------|
| `GroupID` | 可选（条件添加） | 必填？ | ⚠️ 待确认 |
| `model` | ✅ 正确 | ✅ 一致 | ✅ |
| `text` | ✅ 正确 | ✅ 一致 | ✅ |
| `voice_setting.voice_id` | ✅ 正确 | ✅ 一致 | ✅ |
| `voice_setting.speed` | ✅ 正确 | ✅ 一致 | ✅ |
| `voice_setting.vol` | ✅ 正确 | ✅ 一致 | ✅ |
| `voice_setting.pitch` | ✅ 正确 | ✅ 一致 | ✅ |
| `audio_setting.sample_rate` | ❌ `audio_sample_rate` | `sample_rate` | ❌ 字段名错误 |
| `audio_setting.bitrate` | ✅ 正确 | ✅ 一致 | ✅ |
| `audio_setting.format` | ✅ 正确 | ✅ 一致 | ✅ |
| `audio_setting.channel` | ✅ 正确 | ✅ 一致 | ✅ |

## 可能的原因

### 1. `audio_setting` 字段名错误
当前实现使用 `audio_sample_rate`，官方文档使用 `sample_rate`

### 2. `GroupID` 缺失
如果 MiniMax API 要求 `GroupID` 为必填项，但当前实现中该字段是可选的

### 3. 认证问题
- API Key 未正确配置
- Bearer Token 格式错误

### 4. 数据库配置问题
用户可能还没有在 `/glht/api` 页面添加 MiniMax 配置

## 建议的解决方案

### 方案 1：修复字段名（优先级：高）

修改 `/lib/services/minimax-tts-service.ts`：

```typescript
audio_setting: {
  sample_rate: 32000,  // 改为 sample_rate
  bitrate: 128000,
  format: 'mp3',
  channel: 2,
}
```

### 方案 2：确保 GroupID 存在（优先级：中）

在管理后台 `/glht/api` 的 MiniMax 配置中，确保 Group ID 已填写。

### 方案 3：添加详细的调试日志（优先级：中）

在 TTS 服务中添加请求体日志：

```typescript
console.log('[v0] MiniMax request body:', JSON.stringify(requestBody, null, 2))
```

### 方案 4：验证 API Key（优先级：高）

确认数据库中的 MiniMax 配置：
```sql
SELECT * FROM minimax_voice_configs WHERE enabled = true;
```

## 测试步骤

1. 修复 `audio_setting.sample_rate` 字段名
2. 在 `/glht/api` 添加 MiniMax 配置（包含 Group ID 和 API Key）
3. 在 `/minimax1` 或 `/wd/sy` 测试 TTS 功能
4. 检查控制台日志和网络请求详情

## 相关文件清单

```
app/api/minimax/tts/route.ts          # TTS API 路由
lib/services/minimax-tts-service.ts   # TTS 服务类
components/wd/sy/tts-panel.tsx        # TTS 前端组件
app/minimax1/page.tsx                 # 测试页面
app/api/admin/minimax-config/route.ts # 配置管理 API
components/admin/api/minimax-config.tsx # 配置管理界面
```

## 官方文档参考

- `1音色快速复刻.txt` - 声音克隆 API
- `2同步语音合成.txt` - 同步 TTS API
- `3异步语音合成.txt` - 异步 TTS API
- `4系统语音列表.txt` - 预设音色列表

## 环境信息

- Next.js 版本：16.1.6 (Turbopack)
- API 端点：https://v0-ai-kt.vercel.app
- 错误页面：`/minimax1`, `/wd/sy`

## 状态

- [ ] 问题已识别
- [ ] 修复方案已确认
- [ ] 代码已修改
- [ ] 测试通过
- [ ] 部署完成

---

**创建时间**: 2026-02-15
**报告人**: v0
**优先级**: 高
**类型**: Bug

# AI 辅助决策 — 前端对接接口文档

> 后端基地址: `http://localhost:8080`

---

## 一、REST 接口（3个）

### 1. 手动触发 AI 分析

```
POST /ai/analyze
Content-Type: application/json
```

**请求体：**
```json
{
  "batchNo": "B20260413001",
  "deviceCode": "DEV00001",
  "processType": "FILLING",
  "mean": 11.52,
  "variance": 0.0034,
  "maxVal": 11.68,
  "minVal": 11.35,
  "sampleCount": 120,
  "windowStartTime": 1744531200000,
  "windowEndTime": 1744531260000
}
```

**响应：**
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "deviceCode": "DEV00001",
    "batchNo": "B20260413001",
    "processType": "FILLING",
    "riskScore": 0.3,
    "riskLevel": "低风险 🟢",
    "reason": "各项指标正常，fill_std较低，运行稳定",
    "suggestion": "维持当前参数，按计划巡检",
    "finalDecision": "运行正常",
    "statsSnapshot": "Mean=11.5200, Std=0.0583, Speed=200.0, Temp=0.3300, Samples=120",
    "analysisTime": "2026-04-13T14:30:00"
  }
}
```

---

### 2. 查询设备最近一次 AI 分析结果（Redis 缓存，10分钟TTL）

```
GET /ai/latest/{deviceCode}
```

**示例：** `GET /ai/latest/DEV00001`

**响应：** `data` 结构同上。无缓存时：
```json
{ "code": 0, "msg": "该设备暂无 AI 分析记录", "data": null }
```

---

### 3. 分页查询 AI 分析历史记录（MySQL）

```
GET /ai/history
```

**Query 参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 页大小 |
| deviceCode | String | 否 | - | 设备编码筛选 |
| riskLevel | String | 否 | - | 风险等级：`高风险` / `中风险` / `低风险` |

**示例：** `GET /ai/history?pageNum=1&pageSize=10&deviceCode=DEV00001`

**响应：**
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "records": [
      {
        "deviceCode": "DEV00001",
        "batchNo": "B20260413001",
        "processType": "FILLING",
        "riskScore": 0.82,
        "riskLevel": "高风险 🔴",
        "reason": "fill_std=25.3，波动较大，可能存在设备异常",
        "suggestion": "建议检查灌装阀门，降低生产速度",
        "finalDecision": "建议检查灌装阀门，降低生产速度",
        "statsSnapshot": "Mean=500.12, Std=25.30, Speed=216.7, Temp=2.45, Samples=130",
        "analysisTime": "2026-04-13T14:25:00"
      }
    ],
    "total": 56,
    "pages": 6,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

---

## 二、WebSocket 实时推送

**连接地址：** `ws://localhost:8080/ws/alarm`

与现有告警共用同一个 WebSocket 连接，通过 `type` 字段区分消息类型。

### AI 分析推送（每分钟窗口触发一次）

Flink 1分钟窗口聚合完成 → DeepSeek AI 分析 → 服务端主动推送：

```json
{
  "type": "ai_analysis",
  "deviceCode": "DEV00001",
  "batchNo": "B20260413001",
  "processType": "FILLING",
  "riskScore": 0.3,
  "riskLevel": "低风险 🟢",
  "reason": "各项指标正常",
  "suggestion": "维持当前参数",
  "finalDecision": "运行正常",
  "statsSnapshot": "Mean=11.52, Std=0.06, ...",
  "analysisTime": "2026-04-13T14:30:00"
}
```

### 异常告警推送（原有）

```json
{
  "type": "alarm",
  "data": {
    "deviceCode": "DEV00002",
    "alarmLevel": "CRITICAL",
    "alarmMsg": "检测到异常！当前值 45.80 偏离标准范围...",
    ...
  },
  "timestamp": 1744531200000
}
```

### 前端区分消息类型

```js
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)

  if (msg.type === 'ai_analysis') {
    // AI 分析结果 —— 字段直接在 msg 上
    console.log(msg.riskLevel, msg.finalDecision, msg.riskScore)
  }
  else if (msg.type === 'alarm') {
    // 异常告警 —— 实际数据在 msg.data 里
    console.log(msg.data.alarmMsg)
  }
}
```

---

## 三、响应字段说明

### AiAnalysisVO

| 字段 | 类型 | 说明 |
|------|------|------|
| `deviceCode` | String | 设备编码 |
| `batchNo` | String | 生产批次号 |
| `processType` | String | 工序类型 |
| `riskScore` | Double | 风险评分 0~1（DeepSeek AI 输出） |
| `riskLevel` | String | `低风险 🟢` / `中风险 🟡` / `高风险 🔴` |
| `reason` | String | AI 原因分析 |
| `suggestion` | String | AI 操作建议 |
| `finalDecision` | String | 最终决策（强制规则优先级 > AI 建议） |
| `statsSnapshot` | String | Flink 窗口统计数据摘要 |
| `analysisTime` | String | 分析时间 `yyyy-MM-ddTHH:mm:ss` |

### 统一响应格式 Result

| 字段 | 说明 |
|------|------|
| `code` | 1 成功，0 失败 |
| `msg` | 错误信息（成功时为 null） |
| `data` | 业务数据 |

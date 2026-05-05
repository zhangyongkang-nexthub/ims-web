# AI 数据分析 & 辅助决策 扩展接口文档

> 基础路径: `http://localhost:8080`  
> 版本: v2.0  
> 更新日期: 2026-05-03  
> 说明: 本文档涵盖批次质量报告、设备运行日报、AI 智能问答、数据分析看板、AI 自动维修工单等新增功能接口

---

## 一、批次质量分析报告 (BatchQualityController)

> 基础路径: `/batch-quality`  
> 数据来源: ClickHouse (IoT 历史数据聚合) + MySQL (批次/告警/工艺) + DeepSeek AI 生成质量报告

### 1.1 生成批次质量分析报告

```
GET /batch-quality/report/{batchNo}
```

**路径参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| batchNo | String | 是 | 批次号，如 `B20260413001` |

**响应:**
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "batchNo": "B20260413001",
    "targetQty": 5000,
    "actualQty": 4980,
    "badQty": 15,
    "yieldRate": 99.70,
    "batchStatus": "已停止",
    "startTime": "2026-04-13 08:00:00",
    "endTime": "2026-04-13 16:30:00",
    "stationStatsList": [
      {
        "deviceCode": "DEV00001",
        "processType": "MIXING",
        "parameterName": "糖度(Brix)",
        "unit": "°Bx",
        "targetValue": 11.5,
        "minThreshold": 11.0,
        "maxThreshold": 12.0,
        "mean": 11.52,
        "stdDev": 0.058,
        "maxVal": 11.68,
        "minVal": 11.35,
        "sampleCount": 9600,
        "outOfRangeCount": 12,
        "outOfRangeRate": 0.13,
        "cpk": 2.87
      }
    ],
    "totalAlarmCount": 3,
    "alarmDistribution": [
      {
        "deviceCode": "DEV00002",
        "processType": "STERILIZATION",
        "alarmCount": 2
      }
    ],
    "qualityGrade": "A",
    "qualityScore": 92.5,
    "aiReportSummary": "本批次整体质量优良，8个关键工艺参数中7个CPK>1.33...",
    "aiRootCauseAnalysis": "温度传感器DEV00002在14:20出现短暂超标，疑热交换器受料温影响...",
    "aiImprovementSuggestion": "1. 建议检查杀菌段热交换器清洁周期\n2. 适当放宽温度响应阈值...",
    "reportTime": "2026-05-03 10:30:00"
  }
}
```

**字段说明:**

| 字段 | 说明 |
|------|------|
| stationStatsList | 8个传感器的统计明细（均值、标准差、CPK、超标率等） |
| cpk | 过程能力指数: >1.33 优秀, 1.0~1.33 一般, <1.0 不足 |
| qualityGrade | AI 质量评级: A(优秀), B(良好), C(一般), D(不合格) |
| qualityScore | AI 综合评分 0~100 |
| aiReportSummary | AI 生成的质量总评 |
| aiRootCauseAnalysis | AI 异常根因分析 |
| aiImprovementSuggestion | AI 改善建议 |

---

### 1.2 查询批次时序数据（折线图）

```
GET /batch-quality/timeseries/{batchNo}/{deviceCode}
```

**路径参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| batchNo | String | 是 | 批次号 |
| deviceCode | String | 是 | 设备编码，如 `DEV00001` |

**查询参数:**

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| limit | int | 否 | 5000 | 最大返回数据点数 |

**响应:**
```json
{
  "code": 1,
  "data": [
    {
      "event_time": "2026-04-13 08:00:01",
      "sensor_value": 11.52
    },
    {
      "event_time": "2026-04-13 08:00:02",
      "sensor_value": 11.48
    }
  ]
}
```

---

### 1.3 清除批次报告缓存

```
DELETE /batch-quality/cache/{batchNo}
```

清除指定批次的质量报告缓存，下次请求将重新生成。

---

## 二、设备运行日报 + AI 维保决策 (DeviceDailyReportController)

> 基础路径: `/device-report`  
> 数据来源: ClickHouse (当日/昨日 IoT 聚合) + MySQL (设备档案/维修历史/告警) + DeepSeek AI 维保建议

### 2.1 生成指定日期的设备运行日报

```
GET /device-report/daily
```

**查询参数:**

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| date | String | 否 | 昨日 | 报告日期，格式 `yyyy-MM-dd` |

**响应:**
```json
{
  "code": 1,
  "data": {
    "reportDate": "2026-05-02",
    "generateTime": "2026-05-03 09:00:00",
    "deviceSummaries": [
      {
        "deviceCode": "DEV00001",
        "deviceType": "BRIX",
        "equipName": "糖度检测仪",
        "sampleCount": 86400,
        "mean": 11.51,
        "stdDev": 0.062,
        "outOfRangeRate": 0.08,
        "alarmCount": 1,
        "healthScore": 95.2,
        "trend": "STABLE",
        "runningDays": 120
      },
      {
        "deviceCode": "DEV00002",
        "deviceType": "TEMP",
        "equipName": "杀菌温控仪",
        "sampleCount": 86400,
        "mean": 137.5,
        "stdDev": 0.85,
        "outOfRangeRate": 0.15,
        "alarmCount": 3,
        "healthScore": 82.0,
        "trend": "DOWN",
        "runningDays": 120
      }
    ],
    "alarmTopDevices": [
      {
        "deviceCode": "DEV00002",
        "deviceType": "TEMP",
        "alarmCount": 3,
        "topAlarmMsg": "温度超上限: 当前值 141.2℃, 标准范围 [135~140]"
      }
    ],
    "aiDailyOverview": "产线整体运行平稳，8台传感器中7台健康评分>90分。DEV00002温度传感器出现3次超标报警，需重点关注...",
    "maintenanceSuggestions": [
      {
        "deviceCode": "DEV00002",
        "equipName": "杀菌温控仪",
        "urgency": "HIGH",
        "suggestion": "建议立即检查热交换器清洁状态，校验温控PID参数",
        "suggestedTime": "2026-05-03",
        "reason": "昨日超标率0.15%且连续3次报警，健康评分较前日下降8分"
      },
      {
        "deviceCode": "DEV00006",
        "equipName": "旋盖扭矩检测仪",
        "urgency": "LOW",
        "suggestion": "建议在下次计划停机时进行常规保养",
        "suggestedTime": "2026-05-10",
        "reason": "设备运行平稳但已累计运行120天，接近保养周期"
      }
    ]
  }
}
```

**字段说明:**

| 字段 | 说明 |
|------|------|
| deviceSummaries | 各传感器当日运行统计摘要 |
| healthScore | 运行健康评分 0~100（基于超标率、告警次数、波动等综合计算） |
| trend | 相比前一日趋势: UP(变好) / DOWN(变差) / STABLE(稳定) |
| alarmTopDevices | 告警最多的设备 Top 排名 |
| aiDailyOverview | AI 产线全局日评 |
| maintenanceSuggestions | AI 维保建议，含紧急程度和建议时间 |
| urgency | 紧急程度: HIGH(立即处理) / MEDIUM(近期安排) / LOW(计划保养) |

---

### 2.2 生成今日日报

```
GET /device-report/daily/today
```

基于今日已有的 IoT 数据生成日报（实时截止到当前时刻）。

**响应:** 同 2.1

---

### 2.3 获取最近缓存的日报

```
GET /device-report/daily/latest
```

获取最近一份已生成并缓存的日报，不重新调用 AI。

**响应:** 同 2.1。如无缓存返回:
```json
{
  "code": 0,
  "msg": "暂无缓存的日报，请先生成"
}
```

---

## 三、AI 智能问答 — Text-to-SQL (AiChatController)

> 基础路径: `/ai/chat`  
> 流程: 用户自然语言提问 → LLM 生成 SQL → 安全校验 → 执行查询 → LLM 总结回答

### 3.1 AI 智能问答

```
POST /ai/chat
Content-Type: application/json
```

**请求体:**
```json
{
  "question": "最近7天有多少次报警？按设备分组统计"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| question | String | 是 | 用户的自然语言问题 |

**响应:**
```json
{
  "code": 1,
  "data": {
    "question": "最近7天有多少次报警？按设备分组统计",
    "generatedSql": "SELECT device_code, COUNT(*) AS alarm_count FROM mes_alarm_record WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY device_code ORDER BY alarm_count DESC LIMIT 500",
    "queryResult": [
      { "device_code": "DEV00002", "alarm_count": 12 },
      { "device_code": "DEV00007", "alarm_count": 8 },
      { "device_code": "DEV00003", "alarm_count": 5 }
    ],
    "answer": "最近7天共有25次报警。其中温度传感器(DEV00002)报警最多，共12次；压力传感器(DEV00007)8次；容量传感器(DEV00003)5次。建议重点关注温度监测环节。",
    "timestamp": "2026-05-03 10:30:00"
  }
}
```

**安全机制:**
- 仅允许 `SELECT` 查询，禁止 `INSERT/UPDATE/DELETE/DROP` 等操作
- 自动追加 `LIMIT 500` 防止大量数据返回
- 查询结果超过 100 条时自动截断

**支持查询的数据表:**

| 表名 | 说明 | 示例问题 |
|------|------|---------|
| mes_alarm_record | 报警记录 | "今天有多少未处理的报警？" |
| eam_equipment | 设备档案 | "有多少台设备处于故障状态？" |
| eam_repair_order | 维修工单 | "AI自动创建了多少个维修工单？" |
| mes_device | 传感器 | "系统中有多少个传感器？" |
| mes_work_order | 生产工单 | "当前有多少个在生产中的工单？" |
| mes_production_batch | 生产批次 | "昨天的批次产量和良率是多少？" |
| mes_product_stock | 产成品库存 | "当前库存最多的产品是什么？" |
| mes_decision_log | AI决策日志 | "AI做了多少次高风险判决？" |

**错误场景:**

问题为空:
```json
{ "code": 0, "msg": "问题不能为空" }
```

SQL 生成失败:
```json
{
  "code": 1,
  "data": {
    "question": "...",
    "answer": "抱歉，我无法理解您的问题，请尝试换个方式描述。错误: ...",
    "timestamp": "2026-05-03 10:30:00"
  }
}
```

不安全 SQL 被拦截:
```json
{
  "code": 1,
  "data": {
    "question": "...",
    "generatedSql": "DELETE FROM ...",
    "answer": "抱歉，生成的查询包含不安全操作，已被拦截。请仅提出数据查询类问题。",
    "timestamp": "2026-05-03 10:30:00"
  }
}
```

---

## 四、数据分析看板 (DashboardController)

> 基础路径: `/dashboard`  
> 数据来源: MySQL 业务表聚合统计

### 4.1 报警统计

```
GET /dashboard/alarm-stats?range=7d
```

**查询参数:**

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| range | String | 否 | 7d | 时间范围: `today` / `7d` / `30d` |

**响应:**
```json
{
  "code": 1,
  "data": {
    "totalAlarms": 45,
    "criticalCount": 8,
    "warnCount": 37,
    "handledCount": 30,
    "unhandledCount": 15,
    "dailyTrend": [
      { "date": "04-27", "count": 5 },
      { "date": "04-28", "count": 8 },
      { "date": "04-29", "count": 3 },
      { "date": "04-30", "count": 12 },
      { "date": "05-01", "count": 7 },
      { "date": "05-02", "count": 6 },
      { "date": "05-03", "count": 4 }
    ]
  }
}
```

---

### 4.2 生产统计

```
GET /dashboard/production-stats?range=7d
```

**查询参数:** 同 4.1

**响应:**
```json
{
  "code": 1,
  "data": {
    "totalBatches": 14,
    "totalActualQty": 68500,
    "totalBadQty": 210,
    "yieldRate": 99.69,
    "dailyTrend": [
      { "date": "04-27", "count": 2 },
      { "date": "04-28", "count": 2 },
      { "date": "04-29", "count": 2 },
      { "date": "04-30", "count": 2 },
      { "date": "05-01", "count": 2 },
      { "date": "05-02", "count": 2 },
      { "date": "05-03", "count": 2 }
    ]
  }
}
```

| 字段 | 说明 |
|------|------|
| totalBatches | 期间内批次总数 |
| totalActualQty | 实际总产量 |
| totalBadQty | 不良品总数 |
| yieldRate | 合格率 (%) |
| dailyTrend | 每日批次数趋势 |

---

### 4.3 设备状态总览

```
GET /dashboard/equipment-overview
```

**响应:**
```json
{
  "code": 1,
  "data": {
    "total": 8,
    "running": 6,
    "fault": 1,
    "stopped": 0,
    "scrapped": 1
  }
}
```

| 字段 | 说明 |
|------|------|
| total | 设备总数 |
| running | 运行中 (status=1) |
| fault | 故障 (status=2) |
| stopped | 停用 (status=0) |
| scrapped | 报废 (status=3) |

---

### 4.4 维修工单统计

```
GET /dashboard/repair-stats?range=7d
```

**查询参数:** 同 4.1

**响应:**
```json
{
  "code": 1,
  "data": {
    "totalOrders": 12,
    "pendingCount": 3,
    "repairingCount": 1,
    "completedCount": 8,
    "aiTriggeredCount": 5,
    "manualCount": 7
  }
}
```

| 字段 | 说明 |
|------|------|
| totalOrders | 工单总数 |
| pendingCount | 待修 (status=0) |
| repairingCount | 维修中 (status=1) |
| completedCount | 已完成 (status=2) |
| aiTriggeredCount | AI 自动触发的工单 (source_type=2) |
| manualCount | 人工报修的工单 (source_type=1) |

---

## 五、AI 自动创建维修工单

> 该功能为后台自动逻辑，无独立 API 接口，集成在 AI 辅助决策流程中

### 触发条件

当 AI 风险评分 **≥ 0.8**（高风险）时，系统自动创建维修工单。

### 执行流程

```
AI 分析完成 (riskScore ≥ 0.8)
        │
        ▼
通过传感器编码查找所属生产设备
        │
        ▼
防重复检查: 该设备是否已有待修/维修中的工单？
        │
  ┌─────┴─────┐
  │有          │无
  │            ▼
  跳过      创建维修工单
            ├ order_no: AI-RPR{时间戳}
            ├ source_type: 2 (AI自动触发)
            ├ priority: 2(紧急, ≥0.9) / 1(普通, 0.8~0.9)
            ├ fault_desc: [AI自动诊断] {原因} → {建议}
            ├ status: 0 (待修)
            └ 同时更新设备状态为故障(status=2)
```

### 查看 AI 自动创建的工单

使用现有的维修工单接口，按 `source_type=2` 筛选:

```
GET /repair-orders?sourceType=2
```

或通过看板统计查看:

```
GET /dashboard/repair-stats?range=7d
```

响应中 `aiTriggeredCount` 即为 AI 自动触发的工单数。

---

## 六、功能架构总览

```
┌──────────────────────────────────────────────────────────────┐
│                    数据分析 & AI 辅助决策                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  批次质量报告  │  设备运行日报  │  AI 智能问答  │   数据分析看板   │
│ ClickHouse   │ ClickHouse   │ MySQL        │   MySQL        │
│ + MySQL      │ + MySQL      │ Text-to-SQL  │   聚合统计      │
│ + AI 报告    │ + AI 维保建议  │ + AI 总结    │   趋势图表      │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                    AI 自动维修工单                              │
│            风险评分 ≥ 0.8 自动创建，防重复，闭环管理               │
├─────────────────────────────────────────────────────────────┤
│              核心 AI 引擎 (规则 + RAG + LLM)                   │
│       Flink 实时异常检测 → Kafka → 混合决策 → WebSocket 推送     │
└─────────────────────────────────────────────────────────────┘
```

---

## 七、接口清单汇总

| 序号 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 1 | GET | `/batch-quality/report/{batchNo}` | 生成批次质量分析报告 |
| 2 | GET | `/batch-quality/timeseries/{batchNo}/{deviceCode}` | 批次时序数据（折线图） |
| 3 | DELETE | `/batch-quality/cache/{batchNo}` | 清除报告缓存 |
| 4 | GET | `/device-report/daily?date=yyyy-MM-dd` | 生成指定日期设备日报 |
| 5 | GET | `/device-report/daily/today` | 生成今日设备日报 |
| 6 | GET | `/device-report/daily/latest` | 获取最近缓存的日报 |
| 7 | POST | `/ai/chat` | AI 智能问答 (Text-to-SQL) |
| 8 | GET | `/dashboard/alarm-stats?range=7d` | 报警统计 |
| 9 | GET | `/dashboard/production-stats?range=7d` | 生产统计 |
| 10 | GET | `/dashboard/equipment-overview` | 设备状态总览 |
| 11 | GET | `/dashboard/repair-stats?range=7d` | 维修工单统计 |


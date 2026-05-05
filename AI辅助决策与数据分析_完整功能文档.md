# 饮料灌装产线智能管控系统 — AI 辅助决策与数据分析 完整功能文档

> 系统名称: IMS 智能制造管控系统  
> 核心架构: Python 数据模拟 → Kafka → Flink 实时处理 → Kafka → Spring Boot（规则引擎 + RAG + DeepSeek LLM）→ WebSocket / ClickHouse / MySQL  
> 基础路径: `http://localhost:8080`  
> 版本: v3.0  
> 更新日期: 2026-05-04

---

## 目录

- [功能总览](#功能总览)
- [一、实时异常检测与报警推送](#一实时异常检测与报警推送)
- [二、智能风险评分（混合决策引擎）](#二智能风险评分混合决策引擎)
- [三、AI 自动创建维修工单](#三ai-自动创建维修工单)
- [四、批次质量分析报告](#四批次质量分析报告)
- [五、设备运行日报 + AI 维保建议](#五设备运行日报--ai-维保建议)
- [六、AI 智能问答（Text-to-SQL）](#六ai-智能问答text-to-sql)
- [七、数据分析看板](#七数据分析看板)
- [八、管理配置接口](#八管理配置接口)
- [完整接口清单](#完整接口清单)

---

## 功能总览

### 系统架构图

```
┌─────────────┐    ┌─────────┐    ┌──────────────────────────┐
│ Python 模拟器 │───▶│  Kafka   │───▶│  Flink 实时流处理引擎     │
│ 8个传感器数据  │    │ ims_iot  │    │  · 1分钟滚动窗口聚合      │
│ 1秒/条       │    │ _data    │    │  · 异常值检测             │
└─────────────┘    └─────────┘    │  · 写入 ClickHouse        │
                                   └──────┬────────┬──────────┘
                                          │        │
                                   ┌──────▼──┐  ┌──▼──────────┐
                                   │ Kafka    │  │ ClickHouse   │
                                   │ 两个Topic │  │ IoT历史数据   │
                                   └──┬───┬──┘  └──────────────┘
                    ┌─────────────────┘   └────────────────┐
                    ▼                                      ▼
         ┌──────────────────┐              ┌───────────────────────┐
         │ ims_alarm_event   │              │ ims_device_health_stats│
         │ 异常报警事件       │              │ 1分钟窗口聚合统计       │
         └────────┬─────────┘              └───────────┬───────────┘
                  │                                    │
                  ▼                                    ▼
         ┌────────────────┐              ┌──────────────────────────┐
         │ 报警消费者       │              │  AI 混合决策引擎           │
         │ AlarmConsumer   │              │  ┌──────────────────┐    │
         │ · 写入MySQL报警表│              │  │ ① 规则引擎(秒级)  │    │
         │ · WebSocket推送  │              │  │ ② RAG知识库检索   │    │
         └────────────────┘              │  │ ③ DeepSeek LLM   │    │
                                         │  │ ④ 降级兜底        │    │
                                         │  └──────────────────┘    │
                                         │  · 风险评分 + WebSocket推送│
                                         │  · 决策日志写入MySQL      │
                                         │  · 高风险自动建维修工单    │
                                         └──────────────────────────┘
                                                     │
                     ┌───────────────────────────────┼───────────────┐
                     ▼                               ▼               ▼
            ┌─────────────────┐          ┌──────────────────┐  ┌──────────┐
            │ 批次质量分析报告  │          │ 设备运行日报       │  │ AI智能问答│
            │ ClickHouse+MySQL│          │ ClickHouse+MySQL  │  │Text-to-SQL│
            │ +AI质量评级      │          │ +AI维保建议        │  │ MySQL查询 │
            └─────────────────┘          └──────────────────┘  └──────────┘
```

### 7大功能模块

| 序号 | 功能模块 | 类型 | 数据来源 | AI 能力 |
|------|---------|------|---------|---------|
| 1 | 实时异常检测与报警 | 实时流处理 | Flink → Kafka | 阈值检测 + WebSocket 推送 |
| 2 | 智能风险评分 | 实时决策 | Flink 1分钟聚合 | 规则引擎 + RAG + LLM 三级混合 |
| 3 | AI 自动创建维修工单 | 自动处置 | 风险评分触发 | 自动诊断 → 自动开单 → 闭环管理 |
| 4 | 批次质量分析报告 | 离线分析 | ClickHouse + MySQL | LLM 生成质量评级/根因/建议 |
| 5 | 设备运行日报 + 维保建议 | 离线分析 | ClickHouse + MySQL | LLM 生成维保建议和紧急程度 |
| 6 | AI 智能问答 | 交互查询 | MySQL (Text-to-SQL) | LLM 生成SQL + LLM 总结回答 |
| 7 | 数据分析看板 | 统计展示 | MySQL 聚合 | 报警/生产/设备/维修 四维统计 |

### 8个传感器

| 设备编码 | 类型 | 参数名 | 正常范围 | 所属工序 |
|---------|------|--------|---------|---------|
| DEV00001 | BRIX | 糖度(Brix) | 11.0~12.0 °Bx | 调配(MIXING) |
| DEV00002 | TEMP | 温度 | 135~140 ℃ | 杀菌(STERILIZATION) |
| DEV00003 | VOLUME | 灌装容量 | 495~505 mL | 灌装(FILLING) |
| DEV00004 | WEIGHT | 称重 | 510~530 g | 灌装(FILLING) |
| DEV00005 | VISION | 视觉偏移 | -2.0~2.0 mm | 贴标(LABELING) |
| DEV00006 | TORQUE | 扭矩 | 1.8~2.5 N·m | 旋盖(CAPPING) |
| DEV00007 | PRESSURE | 压力 | 0.25~0.35 MPa | 充气(CARBONATION) |
| DEV00008 | PH | pH值 | 3.0~4.0 | 调配(MIXING) |

---

## 一、实时异常检测与报警推送

### 1.1 功能说明

**数据链路**: Python模拟器(1秒/条) → Kafka(`ims_iot_data`) → Flink → Kafka(`ims_alarm_event`) → Spring Boot → WebSocket → 前端

**Flink 处理逻辑**:
- 从 Kafka 消费原始 IoT 数据
- 实时逐条检测：当传感器值超出工艺标准范围时，生成异常报警事件
- 同时写入 ClickHouse 存储历史数据
- 异常事件发送到 Kafka `ims_alarm_event` Topic

**Spring Boot 处理逻辑**:
- `AlarmEventConsumer` 监听 `ims_alarm_event`
- 解析报警消息，写入 MySQL `mes_alarm_record` 表
- 通过 `AlarmWebSocketHandler` 广播给所有 WebSocket 客户端

### 1.2 WebSocket 连接

```
ws://localhost:8080/ws/alarm
```

**连接成功消息:**
```json
{
  "type": "connect",
  "message": "WebSocket 长连接已建立，等待异常告警消息...",
  "sessionId": "xxx",
  "timestamp": 1714800000000
}
```

**报警推送消息:**
```json
{
  "type": "alarm",
  "alarmId": null,
  "batchNo": "B20260413001",
  "deviceCode": "DEV00002",
  "processType": "Temp",
  "alarmLevel": "CRITICAL",
  "currentValue": 141.2,
  "standardRange": "[135.0-140.0]",
  "alarmMsg": "检测到异常！当前值 141.20 偏离标准范围 [135.00 - 140.00]",
  "createTime": "2026-05-04 10:06:52"
}
```

### 1.3 报警级别

| 级别 | 含义 | 触发条件 |
|------|------|---------|
| WARN | 警告 | 传感器值接近阈值边界 |
| CRITICAL | 严重 | 传感器值明显超出标准范围 |

---

## 二、智能风险评分（混合决策引擎）

### 2.1 功能说明

**数据链路**: Flink 1分钟滚动窗口聚合 → Kafka(`ims_device_health_stats`) → `DeviceHealthStatsConsumer` → `AiDecisionService` → WebSocket + MySQL

**混合决策架构 (四级递进)**:

```
Step 1: 组装上下文（工艺范围、设备类型、历史数据）
    │
Step 2: 规则引擎预判
    │── 命中硬规则 & skipLlm=true → 直接返回（毫秒级响应）
    │── 命中软规则 → 携带规则信息继续
    │── 未命中 → 继续
    │
Step 3: RAG 知识库检索（关键词匹配 + 工序/设备类型过滤 + 可信度排序）
    │
Step 4: 读取 AI 模型配置（从 mes_ai_model_config 表）
    │
Step 5: 构建增强 Prompt（统计数据 + 工艺范围 + 规则结果 + 知识库 + 历史决策）
    │
Step 6: 调用 DeepSeek LLM
    │── 成功 → 解析 JSON 结果
    │── 失败 → 降级兜底（基于规则或默认中风险）
    │
Step 7: 后处理
    │── 规则校正（规则命中但AI评分偏低时以规则为准）
    │── 记录决策日志（mes_decision_log）
    │── 高风险(≥0.8)自动创建维修工单
    │── WebSocket 推送
```

### 2.2 WebSocket 推送格式

```json
{
  "type": "ai_analysis",
  "deviceCode": "DEV00002",
  "batchNo": "B20260413001",
  "processType": "STERILIZATION",
  "riskScore": 0.35,
  "riskLevel": "低风险 🟢",
  "reason": "温度指标在正常范围内，波动幅度较小",
  "suggestion": "运行正常，无需干预",
  "finalDecision": "运行正常",
  "statsSnapshot": {
    "mean": 137.52,
    "variance": 0.72,
    "maxVal": 139.8,
    "minVal": 135.2,
    "sampleCount": 60
  },
  "analysisTime": "2026-05-04 10:01:00"
}
```

### 2.3 风险等级

| 评分范围 | 等级 | 说明 |
|---------|------|------|
| 0.0 ~ 0.6 | 低风险 🟢 | 运行正常，无需干预 |
| 0.6 ~ 0.8 | 中风险 🟡 | 需关注，建议排查 |
| 0.8 ~ 1.0 | 高风险 🔴 | 需立即处理，自动触发维修工单 |

### 2.4 API 接口

#### 2.4.1 手动触发 AI 分析

```
POST /ai/analyze
Content-Type: application/json
```

**请求体:**
```json
{
  "batchNo": "B20260413001",
  "deviceCode": "DEV00001",
  "processType": "MIXING",
  "mean": 11.52,
  "variance": 0.0034,
  "maxVal": 11.68,
  "minVal": 11.35,
  "sampleCount": 60,
  "windowStartTime": 1744531200000,
  "windowEndTime": 1744531260000
}
```

**响应:**
```json
{
  "code": 1,
  "data": {
    "deviceCode": "DEV00001",
    "batchNo": "B20260413001",
    "processType": "MIXING",
    "riskScore": 0.25,
    "riskLevel": "低风险 🟢",
    "reason": "糖度均值11.52°Bx在标准范围[11.0-12.0]内，波动正常",
    "suggestion": "运行正常，无需干预",
    "finalDecision": "运行正常",
    "statsSnapshot": { "mean": 11.52, "variance": 0.0034, "maxVal": 11.68, "minVal": 11.35, "sampleCount": 60 },
    "decisionType": "AI",
    "knowledgeRefs": ["KB-3: 糖度异常处理方案"],
    "analysisTime": "2026-05-04T10:01:00"
  }
}
```

#### 2.4.2 查询设备最近 AI 分析结果

```
GET /ai/latest/{deviceCode}
```

返回 Redis 缓存的最近一次分析结果。

#### 2.4.3 分页查询 AI 分析历史

```
GET /ai/history?pageNum=1&pageSize=10&deviceCode=DEV00002&riskLevel=高风险
```

---

## 三、AI 自动创建维修工单

### 3.1 功能说明

当 AI 风险评分 **≥ 0.8**（高风险）时，系统自动创建维修工单，实现 "AI 检测 → 自动诊断 → 自动开单 → 等待维修" 全链路自动化。

### 3.2 执行流程

```
AI 分析完成 (riskScore ≥ 0.8)
        │
        ▼
通过传感器编码 (mes_device) 查找所属主机设备 (eam_equipment)
        │
        ▼
防重复检查: 该设备是否已有待修(status=0)/维修中(status=1)的工单？
        │
  ┌─────┴─────┐
  │有          │无
  │            ▼
  跳过      创建维修工单 (eam_repair_order)
            ├ order_no: AI-RPR{时间戳}
            ├ source_type: 2 (AI自动触发)
            ├ priority: 2(紧急, score≥0.9) / 1(普通, 0.8≤score<0.9)
            ├ fault_desc: [AI自动诊断] {reason} → {suggestion}
            ├ status: 0 (待修)
            └ 同时更新设备状态为故障 (eam_equipment.status=2)
```

### 3.3 查看方式

无独立 API，通过现有接口查看：

```
GET /repair-orders?sourceType=2          -- 筛选 AI 自动创建的工单
GET /dashboard/repair-stats?range=7d     -- aiTriggeredCount 字段
GET /ai/decisions?decisionType=RULE      -- 决策日志
```

---

## 四、批次质量分析报告

### 4.1 功能说明

**数据来源**: ClickHouse（IoT 历史数据按批次聚合统计）+ MySQL（批次信息/告警记录/工艺标准）+ DeepSeek LLM 生成质量报告

**分析维度**:
- 8 个传感器的统计指标：均值、标准差、最大最小值、超标率、CPK（过程能力指数）
- 批次产量和良率
- 报警分布
- AI 质量评级（A/B/C/D）、根因分析、改善建议

### 4.2 接口

#### 4.2.1 生成批次质量分析报告

```
GET /batch-quality/report/{batchNo}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| batchNo | String | 是 | 批次号，如 `B20260413001` |

**响应:**
```json
{
  "code": 1,
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
      { "deviceCode": "DEV00002", "processType": "STERILIZATION", "alarmCount": 2 }
    ],
    "qualityGrade": "A",
    "qualityScore": 92.5,
    "aiReportSummary": "本批次整体质量优良，8个关键工艺参数中7个CPK>1.33...",
    "aiRootCauseAnalysis": "温度传感器DEV00002在14:20出现短暂超标，疑热交换器受料温影响...",
    "aiImprovementSuggestion": "1. 建议检查杀菌段热交换器清洁周期\n2. 适当放宽温度响应阈值...",
    "reportTime": "2026-05-04 10:30:00"
  }
}
```

**核心字段说明:**

| 字段 | 说明 |
|------|------|
| cpk | 过程能力指数: >1.33 优秀, 1.0~1.33 一般, <1.0 不足 |
| qualityGrade | AI 质量评级: A(优秀≥90), B(良好≥75), C(一般≥60), D(不合格<60) |
| qualityScore | AI 综合评分 0~100 |
| aiReportSummary | AI 生成的质量总评 |
| aiRootCauseAnalysis | AI 异常根因分析 |
| aiImprovementSuggestion | AI 改善建议 |

#### 4.2.2 查询批次时序数据（折线图）

```
GET /batch-quality/timeseries/{batchNo}/{deviceCode}?limit=5000
```

返回指定批次、指定传感器的原始时序数据点，用于前端绘制折线图。

**响应:**
```json
{
  "code": 1,
  "data": [
    { "event_time": "2026-04-13 08:00:01", "sensor_value": 11.52 },
    { "event_time": "2026-04-13 08:00:02", "sensor_value": 11.48 }
  ]
}
```

#### 4.2.3 清除批次报告缓存

```
DELETE /batch-quality/cache/{batchNo}
```

---

## 五、设备运行日报 + AI 维保建议

### 5.1 功能说明

**数据来源**: ClickHouse（指定日期的 IoT 聚合统计）+ MySQL（设备档案/维修历史/告警记录）+ DeepSeek LLM 生成维保建议

**输出内容**:
- 8 台传感器当日运行摘要（采样数、均值、标准差、超标率、健康评分、趋势）
- 报警 Top 排名
- AI 产线全局日评（文字总结）
- AI 维保建议（逐台设备，含紧急程度和建议维护时间）

### 5.2 接口

#### 5.2.1 生成指定日期的设备运行日报

```
GET /device-report/daily?date=2026-05-03
```

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| date | String | 否 | 昨日 | 格式 `yyyy-MM-dd` |

**响应:**
```json
{
  "code": 1,
  "data": {
    "reportDate": "2026-05-03",
    "generateTime": "2026-05-04 09:00:00",
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
    "aiDailyOverview": "产线整体运行平稳，8台传感器中7台健康评分>90分...",
    "maintenanceSuggestions": [
      {
        "deviceCode": "DEV00002",
        "equipName": "杀菌温控仪",
        "urgency": "HIGH",
        "suggestion": "建议立即检查热交换器清洁状态，校验温控PID参数",
        "suggestedTime": "2026-05-04",
        "reason": "昨日超标率0.15%且连续3次报警，健康评分较前日下降8分"
      }
    ]
  }
}
```

**核心字段说明:**

| 字段 | 说明 |
|------|------|
| healthScore | 运行健康评分 0~100 |
| trend | 相比前一日: UP(变好) / DOWN(变差) / STABLE(稳定) |
| urgency | 紧急程度: HIGH(立即处理) / MEDIUM(近期安排) / LOW(计划保养) |
| suggestedTime | AI 建议的维护日期 |
| aiDailyOverview | AI 产线全局日评 |

#### 5.2.2 生成今日日报

```
GET /device-report/daily/today
```

基于今日已有数据生成（实时截止到当前时刻）。

#### 5.2.3 获取最近缓存的日报

```
GET /device-report/daily/latest
```

获取最近一份已生成的日报（不重新调用 AI）。

---

## 六、AI 智能问答（Text-to-SQL）

### 6.1 功能说明

**流程**: 用户自然语言提问 → LLM 生成 SQL → 安全校验（禁止 DML/DDL）→ 执行查询 → LLM 总结回答

**安全机制**:
- 仅允许 `SELECT` 查询，禁止 `INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE` 等操作
- 自动追加 `LIMIT 500` 防止返回海量数据
- 查询结果超过 100 条时自动截断再送给 LLM 总结

### 6.2 支持查询的数据表

Prompt 中内嵌了 8 张核心表结构及其关联关系：

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

### 6.3 接口

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

**成功响应:**
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
    "timestamp": "2026-05-04 10:30:00"
  }
}
```

**错误场景:**

| 场景 | 响应 |
|------|------|
| 问题为空 | `{"code": 0, "msg": "问题不能为空"}` |
| SQL 生成失败 | answer = "抱歉，我无法理解您的问题，请尝试换个方式描述。" |
| 不安全 SQL 被拦截 | answer = "抱歉，生成的查询包含不安全操作，已被拦截。" |
| SQL 执行失败 | answer = "SQL 执行出错: ..." |

---

## 七、数据分析看板

### 7.1 功能说明

提供 4 个聚合统计接口，用于前端数据看板展示。数据来源为 MySQL 业务表。

### 7.2 接口

#### 7.2.1 报警统计

```
GET /dashboard/alarm-stats?range=7d
```

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| range | String | 7d | `today` / `7d` / `30d` |

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
      { "date": "04-28", "count": 8 },
      { "date": "04-29", "count": 3 },
      { "date": "04-30", "count": 12 }
    ]
  }
}
```

#### 7.2.2 生产统计

```
GET /dashboard/production-stats?range=7d
```

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
      { "date": "04-28", "count": 2 },
      { "date": "04-29", "count": 2 }
    ]
  }
}
```

#### 7.2.3 设备状态总览

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

#### 7.2.4 维修工单统计

```
GET /dashboard/repair-stats?range=7d
```

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

---

## 八、管理配置接口

### 8.1 决策日志 + 反馈闭环

#### 分页查询决策日志

```
GET /ai/decisions?pageNum=1&pageSize=10&deviceCode=DEV00002&decisionType=AI
```

#### 用户反馈

```
POST /ai/decisions/{decisionId}/feedback
Content-Type: application/json

{
  "isAdopted": 1,
  "handleUser": "张工"
}
```

| isAdopted | 含义 |
|-----------|------|
| 0 | 未处理 |
| 1 | 采纳 |
| 2 | 忽略 |

### 8.2 专家知识库管理 (RAG)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/ai/knowledge?pageNum=1&pageSize=10&keyword=温度&processType=FILLING` | 分页查询 |
| POST | `/ai/knowledge` | 新增知识条目 |
| PUT | `/ai/knowledge/{kbId}` | 修改知识条目 |
| DELETE | `/ai/knowledge/{kbId}` | 删除知识条目 |
| GET | `/ai/knowledge/search?keyword=温度波动&processType=FILLING` | 检索测试(Top 5) |

**知识条目结构:**
```json
{
  "kbId": 1,
  "symptomKeyword": "温度波动,超标",
  "processType": "STERILIZATION",
  "deviceType": "TEMP",
  "possibleCause": "热交换器结垢导致传热效率下降",
  "solutionSuggestion": "清洁热交换器管路，校验温控PID参数",
  "expertLevel": 8,
  "source": "MANUAL",
  "hitCount": 12
}
```

### 8.3 规则引擎管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/ai/rules` | 查询所有规则（按优先级排序） |
| POST | `/ai/rules` | 新增规则 |
| PUT | `/ai/rules/{ruleId}` | 修改规则 |
| DELETE | `/ai/rules/{ruleId}` | 删除规则 |

**规则结构:**
```json
{
  "ruleId": 1,
  "ruleName": "温度传感器均值超限",
  "deviceType": "TEMP",
  "metricName": "mean",
  "operator": ">",
  "threshold1": 140.0,
  "threshold2": null,
  "severity": "CRITICAL",
  "actionSuggestion": "立即检查杀菌温度系统",
  "skipLlm": true,
  "priority": 1,
  "isEnabled": 1
}
```

| 字段 | 说明 |
|------|------|
| metricName | 指标: mean(均值), fill_std(相对标准差/CV), speed(极差) |
| operator | 操作符: `>`, `<`, `>=`, `<=`, `BETWEEN` |
| severity | 严重级别: EMERGENCY(紧急), CRITICAL(严重), WARNING(警告) |
| skipLlm | true=命中后直接决策不调用LLM, false=携带规则继续LLM分析 |
| deviceType | 设备类型过滤，null 表示通用规则 |

### 8.4 AI 模型配置管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/ai/model-configs` | 查询所有模型配置 |
| POST | `/ai/model-configs` | 新增/修改配置 |
| POST | `/ai/model-configs/{configId}/activate` | 激活指定配置（停用其他） |

**模型配置结构:**
```json
{
  "configId": 1,
  "modelName": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com",
  "apiKey": "sk-xxx",
  "temperature": 0.3,
  "maxTokens": 800,
  "isActive": 1,
  "remark": "DeepSeek V3 主力模型"
}
```

---

## 完整接口清单

### AI 核心功能接口

| 序号 | 方法 | 路径 | 功能模块 | 说明 |
|------|------|------|---------|------|
| 1 | WS | `ws://localhost:8080/ws/alarm` | 实时推送 | WebSocket 报警 + AI 分析推送 |
| 2 | POST | `/ai/analyze` | 风险评分 | 手动触发 AI 分析 |
| 3 | GET | `/ai/latest/{deviceCode}` | 风险评分 | 查询最近分析结果(Redis) |
| 4 | GET | `/ai/history` | 风险评分 | 分页查询分析历史 |
| 5 | POST | `/ai/chat` | 智能问答 | AI 问答 (Text-to-SQL) |
| 6 | GET | `/batch-quality/report/{batchNo}` | 批次质量 | 生成批次质量分析报告 |
| 7 | GET | `/batch-quality/timeseries/{batchNo}/{deviceCode}` | 批次质量 | 批次时序数据(折线图) |
| 8 | DELETE | `/batch-quality/cache/{batchNo}` | 批次质量 | 清除报告缓存 |
| 9 | GET | `/device-report/daily` | 设备日报 | 生成指定日期设备日报 |
| 10 | GET | `/device-report/daily/today` | 设备日报 | 生成今日设备日报 |
| 11 | GET | `/device-report/daily/latest` | 设备日报 | 获取最近缓存日报 |
| 12 | GET | `/dashboard/alarm-stats` | 数据看板 | 报警统计 |
| 13 | GET | `/dashboard/production-stats` | 数据看板 | 生产统计 |
| 14 | GET | `/dashboard/equipment-overview` | 数据看板 | 设备状态总览 |
| 15 | GET | `/dashboard/repair-stats` | 数据看板 | 维修工单统计 |

### 管理配置接口

| 序号 | 方法 | 路径 | 功能模块 | 说明 |
|------|------|------|---------|------|
| 16 | GET | `/ai/decisions` | 决策日志 | 分页查询决策日志 |
| 17 | POST | `/ai/decisions/{id}/feedback` | 决策日志 | 用户反馈(采纳/忽略) |
| 18 | GET | `/ai/knowledge` | RAG知识库 | 分页查询知识库 |
| 19 | POST | `/ai/knowledge` | RAG知识库 | 新增知识条目 |
| 20 | PUT | `/ai/knowledge/{kbId}` | RAG知识库 | 修改知识条目 |
| 21 | DELETE | `/ai/knowledge/{kbId}` | RAG知识库 | 删除知识条目 |
| 22 | GET | `/ai/knowledge/search` | RAG知识库 | 知识检索测试 |
| 23 | GET | `/ai/rules` | 规则引擎 | 查询所有规则 |
| 24 | POST | `/ai/rules` | 规则引擎 | 新增规则 |
| 25 | PUT | `/ai/rules/{ruleId}` | 规则引擎 | 修改规则 |
| 26 | DELETE | `/ai/rules/{ruleId}` | 规则引擎 | 删除规则 |
| 27 | GET | `/ai/model-configs` | 模型配置 | 查询所有模型 |
| 28 | POST | `/ai/model-configs` | 模型配置 | 新增/修改模型 |
| 29 | POST | `/ai/model-configs/{id}/activate` | 模型配置 | 激活指定模型 |

**共计 29 个接口 + 1 个 WebSocket 端点，覆盖 7 大 AI 功能模块。**

---

## 技术栈总结

| 层级 | 技术 | 用途 |
|------|------|------|
| 数据模拟 | Python | 8 传感器模拟数据生成（1秒/条，独立随机游走，0.1%异常率） |
| 消息队列 | Kafka | IoT 数据传输、异常事件传输、健康统计传输 |
| 实时计算 | Apache Flink | 异常检测、1分钟窗口聚合、ClickHouse 写入 |
| 时序存储 | ClickHouse | IoT 原始数据存储，支持高速聚合查询 |
| 业务数据库 | MySQL | 设备/工单/批次/报警/决策日志等业务表 |
| 缓存 | Redis | AI 分析结果缓存、Flink 批次号查询 |
| 后端框架 | Spring Boot 3 + MyBatis-Plus | REST API + 业务逻辑 |
| AI 大模型 | DeepSeek LLM | 风险分析、质量报告、维保建议、Text-to-SQL |
| 知识检索 | 简化版 RAG | 关键词匹配 + 工序/设备过滤 + 可信度排序 |
| 规则引擎 | 自研配置式 | 硬规则秒级响应，支持设备类型过滤 |
| 实时推送 | WebSocket | 报警事件 + AI 分析结果实时推送 |


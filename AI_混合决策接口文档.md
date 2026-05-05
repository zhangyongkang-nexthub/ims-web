# AI 辅助决策（混合架构）API 接口文档

> 架构: **规则引擎 + 简化版RAG知识库 + LLM 大模型**  
> 基础路径: `/ai`

---

## 一、AI 智能分析

### 1.1 手动触发 AI 分析

```
POST /ai/analyze
```

**请求体:**
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

**响应:**
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "deviceCode": "DEV00001",
    "batchNo": "B20260413001",
    "processType": "FILLING",
    "riskScore": 0.72,
    "riskLevel": "中风险 🟡",
    "reason": "参考[KB-1]灌装阀密封圈老化可能导致fill_std持续上升，结合历史趋势连续5次分析riskScore上升",
    "suggestion": "检查灌装阀组密封件，评估是否需要整组更换",
    "finalDecision": "检查灌装阀组密封件，评估是否需要整组更换",
    "statsSnapshot": "Mean=11.5200, Std=0.0583, Speed=200.0, Temp=0.3300, Samples=120 [AI+RAG]",
    "analysisTime": "2026-04-30T14:30:00"
  }
}
```

**决策类型标记 (statsSnapshot 后缀):**
- `[RULE]` — 规则引擎直接决策，未调用 LLM
- `[AI+RAG]` — 完整流程: 知识检索 + LLM 推理
- `[FALLBACK]` — LLM 不可用时的规则兜底

---

### 1.2 查询最近 AI 分析结果 (Redis 缓存)

```
GET /ai/latest/{deviceCode}
```

**响应:** 同 1.1 的 data 结构

---

### 1.3 分页查询 AI 分析历史

```
GET /ai/history?pageNum=1&pageSize=10&deviceCode=DEV00001&riskLevel=高风险
```

| 参数 | 必填 | 说明 |
|------|------|------|
| pageNum | 否 | 默认1 |
| pageSize | 否 | 默认10 |
| deviceCode | 否 | 按设备筛选 |
| riskLevel | 否 | 按风险等级筛选: 高风险/中风险/低风险 |

---

## 二、决策日志 + 反馈闭环

### 2.1 分页查询决策日志

```
GET /ai/decisions?pageNum=1&pageSize=10&deviceCode=DEV00001&decisionType=AI
```

| 参数 | 必填 | 说明 |
|------|------|------|
| pageNum | 否 | 默认1 |
| pageSize | 否 | 默认10 |
| deviceCode | 否 | 设备编码 |
| decisionType | 否 | 决策类型: RULE/AI/FALLBACK |

**响应:**
```json
{
  "code": 1,
  "data": {
    "records": [
      {
        "decisionId": 1,
        "deviceCode": "DEV00001",
        "batchNo": "B20260413001",
        "triggerSource": "FLINK",
        "decisionType": "AI",
        "riskScore": 0.72,
        "riskLevel": "中风险 🟡",
        "reason": "参考[KB-1]...",
        "suggestion": "检查灌装阀组密封件...",
        "finalDecision": "检查灌装阀组密封件...",
        "referencedKbIds": "1,4",
        "feedback": null,
        "feedbackNote": null,
        "analysisTime": "2026-04-30T14:30:00"
      }
    ],
    "total": "15",
    "pages": "2",
    "pageNum": "1",
    "pageSize": "10"
  }
}
```

---

### 2.2 决策反馈 (采纳 / 忽略 / 标记错误)

```
POST /ai/decisions/{decisionId}/feedback
```

**请求体:**
```json
{
  "feedback": 1,
  "note": "已安排维修人员检查"
}
```

| feedback 值 | 含义 |
|------------|------|
| 1 | 采纳 (会增加引用知识的 hit_count) |
| 0 | 忽略 (误报，不实际操作) |
| -1 | 标记错误 (AI 判断有误) |

---

## 三、专家知识库管理 (RAG 语料)

### 3.1 分页查询知识库

```
GET /ai/knowledge?pageNum=1&pageSize=10&keyword=灌装&processType=FILLING
```

| 参数 | 必填 | 说明 |
|------|------|------|
| keyword | 否 | 搜索关键词(匹配 symptomKeyword 或 possibleCause) |
| processType | 否 | 工序过滤 |

**响应:**
```json
{
  "code": 1,
  "data": {
    "records": [
      {
        "kbId": 1,
        "symptomKeyword": "fill_std持续上升",
        "processType": "FILLING",
        "deviceType": null,
        "possibleCause": "灌装阀密封圈老化导致流量不稳定...",
        "solutionSuggestion": "检查灌装阀组密封件...",
        "expertLevel": 8,
        "source": "MANUAL",
        "hitCount": 12,
        "createTime": "2026-04-30 10:00:00",
        "updateTime": "2026-04-30 14:30:00"
      }
    ],
    "total": "10"
  }
}
```

---

### 3.2 新增知识条目

```
POST /ai/knowledge
```

**请求体:**
```json
{
  "symptomKeyword": "瓶盖松动报警",
  "processType": "CAPPING",
  "deviceType": null,
  "possibleCause": "旋盖扭矩不足或瓶口规格偏差",
  "solutionSuggestion": "校准旋盖扭矩，检查瓶坯供应商批次",
  "expertLevel": 7
}
```

---

### 3.3 修改知识条目

```
PUT /ai/knowledge/{kbId}
```

**请求体:** 同新增，字段按需传入

---

### 3.4 删除知识条目

```
DELETE /ai/knowledge/{kbId}
```

---

### 3.5 知识检索测试

```
GET /ai/knowledge/search?keyword=温度波动&processType=FILLING
```

返回 Top 5 匹配的知识条目，用于验证 RAG 检索效果。

---

## 四、规则引擎管理

### 4.1 查询所有规则

```
GET /ai/rules
```

**响应:**
```json
{
  "code": 1,
  "data": [
    {
      "ruleId": 1,
      "ruleName": "灌装波动极端超标",
      "deviceType": null,
      "metricName": "fill_std",
      "operator": ">",
      "thresholdValue": 40.0000,
      "thresholdValue2": null,
      "severity": "EMERGENCY",
      "action": "立即停机检查（灌装波动严重超标，可能存在泄漏）",
      "skipLlm": 1,
      "isActive": 1,
      "priority": 10
    }
  ]
}
```

**字段说明:**

| 字段 | 说明 |
|------|------|
| metricName | 指标: fill_std(灌装标准差) / speed(速度) / temp(温度波动) |
| operator | 比较操作符: > / < / >= / <= / BETWEEN |
| severity | 严重程度: WARNING(预警) / CRITICAL(严重) / EMERGENCY(紧急) |
| skipLlm | 命中时是否跳过LLM: 1=直接决策不调AI, 0=仍然调AI但规则作为参考 |
| priority | 优先级越小越先匹配 |

---

### 4.2 新增规则

```
POST /ai/rules
```

**请求体:**
```json
{
  "ruleName": "新规则名称",
  "metricName": "fill_std",
  "operator": ">",
  "thresholdValue": 30.0,
  "severity": "CRITICAL",
  "action": "建议停机检查",
  "skipLlm": 1,
  "isActive": 1,
  "priority": 30
}
```

---

### 4.3 修改规则

```
PUT /ai/rules/{ruleId}
```

---

### 4.4 删除规则

```
DELETE /ai/rules/{ruleId}
```

---

## 五、模型配置管理

### 5.1 查询所有模型配置

```
GET /ai/model-configs
```

**响应:**
```json
{
  "code": 1,
  "data": [
    {
      "configId": 1,
      "configName": "饮料灌装线分析",
      "modelName": "deepseek-chat",
      "baseUrl": null,
      "apiKey": null,
      "systemPrompt": "你是一名饮料灌装生产线的资深工艺工程师...",
      "temperature": 0.15,
      "maxTokens": 500,
      "isActive": 1,
      "createTime": "2026-04-30 10:00:00"
    }
  ]
}
```

> `baseUrl` 和 `apiKey` 为 null 时使用 application.yml 中的全局配置

---

### 5.2 新增/修改模型配置

```
POST /ai/model-configs
```

**请求体:**
```json
{
  "configName": "通义千问版本",
  "modelName": "qwen-max",
  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "apiKey": "sk-xxx",
  "systemPrompt": "你是工业分析专家...",
  "temperature": 0.20,
  "maxTokens": 800
}
```

> 如果带 `configId` 则为修改，不带则为新增

---

### 5.3 激活指定模型配置

```
POST /ai/model-configs/{configId}/activate
```

激活指定配置，同时停用其他所有配置。系统同一时刻只有一个活跃模型。

---

## 六、系统决策流程说明

```
                    Flink/手动触发
                         │
                         ▼
              ┌─── 组装上下文 ───┐
              │ 设备档案         │
              │ 维修历史(3条)    │
              │ 历史趋势(5条)    │
              │ 基线对比         │
              └────────┬────────┘
                       ▼
              ┌─── 规则引擎 ───┐
              │ 按优先级依次匹配  │
              │ 命中EMERGENCY?  │
              └───┬────────┬───┘
                  │yes     │no
                  ▼        ▼
          直接决策      RAG检索
          [RULE]     ┌────┴────┐
                     │匹配Top3  │
                     │专家知识   │
                     └────┬────┘
                          ▼
                   构建增强Prompt
                   (数据+上下文+知识)
                          ▼
                     调用 LLM API
                          ▼
                  ┌─── 解析+校验 ──┐
                  │ 规则兜底检查    │
                  │ 如规则>AI则取规则│
                  └───────┬───────┘
                          ▼
               写入 decision_log
               缓存到 Redis
               推送 WebSocket
                          ▼
                    前端展示决策
                    用户可反馈
```

---

## 七、WebSocket 推送格式

AI 分析完成后自动通过 WebSocket 推送:

```json
{
  "type": "ai_analysis",
  "deviceCode": "DEV00001",
  "batchNo": "B20260413001",
  "processType": "FILLING",
  "riskScore": 0.72,
  "riskLevel": "中风险 🟡",
  "reason": "参考[KB-1]灌装阀密封圈老化...",
  "suggestion": "检查灌装阀组密封件...",
  "finalDecision": "检查灌装阀组密封件...",
  "statsSnapshot": "Mean=11.5200, Std=0.0583... [AI+RAG]",
  "analysisTime": "2026-04-30T14:30:00"
}
```

---

## 八、数据库表清单

| 表名 | 说明 | 用途 |
|------|------|------|
| mes_knowledge_base | 专家知识库 | RAG 检索语料，存储工业排障经验 |
| mes_ai_model_config | 模型配置 | LLM 模型、提示词、参数可配置 |
| mes_ai_rule_config | 规则配置 | 硬规则阈值，命中时跳过 LLM |
| mes_decision_log | 决策日志 | 完整决策记录 + 用户反馈闭环 |
| mes_ai_analysis_record | 分析记录 | 历史分析结果(兼容旧接口) |

> 建表 SQL 见: `ims-server/src/main/resources/sql/ai_hybrid_init.sql`


# 排班与交接班管理 API 文档

> 四张表：`mes_team`（班组）、`mes_shift`（班次定义）、`mes_shift_schedule`（排班计划）、`mes_shift_handover`（交接班记录）  
> `sys_user` 新增 `team_id` 字段，用户归属班组，班组有组长

---

## 一、数据模型

```
mes_team（班组）
  └── sys_user.team_id → 用户归属班组
  └── leaderId → 组长（也是 sys_user）

mes_shift（班次：早班/晚班）
  └── startTime / endTime / isActive

mes_shift_schedule（排班规则）
  └── startDate + endDate + repeatDays（日期范围+周重复）
  └── shiftId + userId + stationId

mes_shift_handover（交接班）
  └── batchId + fromUserId + toUserId
```

### mes_shift_schedule 排班核心字段

| 字段 | 类型 | 说明 |
|------|------|------|
| start_date | date | 排班开始日期 |
| end_date | date | 排班结束日期 |
| repeat_days | varchar | 重复的星期几，逗号分隔。`1,2,3,4,5`=周一到周五，空=每天 |
| shift_id | bigint | 班次 |
| user_id | bigint | 操作员 |
| station_id | bigint | 工位 |

**示例：** `startDate=2026-04-28, endDate=2026-05-31, repeatDays="1,2,3,4,5"` → 4/28到5/31每周一到周五上班

---

## 二、班组管理 `/teams`

### 2.1 查询班组列表

```
GET /teams?pageNum=1&pageSize=10&searchKey=
```

**响应字段：** teamId, teamName, leaderId, leaderName, memberCount, remark

### 2.2 新增班组

```
POST /teams
{ "teamName": "A组", "leaderId": 5, "remark": "灌装线班组" }
```

### 2.3 修改班组 / 2.4 删除班组

```
PUT /teams/{teamId}
DELETE /teams/{teamId}
```

### 2.5 分配用户到班组

```
PUT /teams/{teamId}/assign?userId=5
```

### 2.6 移除用户出班组

```
PUT /teams/remove-user?userId=5
```

### 2.7 查询班组成员

```
GET /schedules/team-members?teamId=1
```

**响应字段：** userId, nickname, employeeNo, isLeader

---

## 三、班次定义 `/shifts`

### 3.1 查询 / 3.2 新增 / 3.3 修改 / 3.4 删除

```
GET    /shifts?pageNum=1&pageSize=100
POST   /shifts  { "shiftName": "早班", "startTime": "08:00:00", "endTime": "16:00:00", "isActive": 1 }
PUT    /shifts/{shiftId}
DELETE /shifts/{shiftId}
```

**响应字段：** shiftId, shiftName, startTime, endTime, isActive, isActiveLabel

---

## 四、排班管理 `/schedules`

### 4.1 查询排班规则列表

```
GET /schedules?pageNum=1&pageSize=20&userId=&stationId=&shiftId=
```

**响应字段：** scheduleId, startDate, endDate, repeatDays, repeatDaysLabel, shiftId, shiftName, userId, userName, teamName, stationId, stationName, createTime

### 4.2 新增排班规则

```
POST /schedules
{
  "startDate": "2026-04-28",
  "endDate": "2026-05-31",
  "repeatDays": "1,2,3,4,5",
  "shiftId": 1,
  "userId": 5,
  "stationId": 10
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string(yyyy-MM-dd) | **是** | 开始日期 |
| endDate | string(yyyy-MM-dd) | 否 | 结束日期，不传=仅当天 |
| repeatDays | string | 否 | 重复的星期几（1-7逗号分隔），不传=每天 |
| shiftId | long | **是** | 班次 |
| userId | long | **是** | 人员 |
| stationId | long | 否 | 工位 |

**排班示例：**

| 场景 | startDate | endDate | repeatDays | 含义 |
|------|-----------|---------|------------|------|
| 单日排班 | 2026-04-28 | 2026-04-28 | 空 | 只在4月28号 |
| 连续排班 | 2026-04-28 | 2026-05-10 | 空 | 4/28到5/10每天 |
| 工作日排班 | 2026-04-28 | 2026-12-31 | 1,2,3,4,5 | 到年底每周一至周五 |
| 周末排班 | 2026-04-28 | 2026-12-31 | 6,7 | 到年底每周六日 |

### 4.3 按班组批量排班

```
POST /schedules/batch-by-team?teamId=1&shiftId=1&startDate=2026-04-28&endDate=2026-05-31&repeatDays=1,2,3,4,5&stationId=10
```

> 整个班组的成员（`sys_user.team_id=1`）统一安排到同一排班规则

### 4.4 修改 / 4.5 删除

```
PUT    /schedules/{scheduleId}
DELETE /schedules/{scheduleId}
```

### 4.6 查询某天的实际排班表

```
GET /schedules/daily?workDate=2026-04-28&stationId=&shiftId=
```

> 展开日期范围 + 周重复规则，返回当天实际生效的排班

### 4.7 查询某天空闲人员

```
GET /schedules/available-users?workDate=2026-04-28&shiftId=1
```

> 返回该天该班次未被排班的启用用户（含班组名），可用于安排维修

### 4.8 查询某人某天的工作全貌

```
GET /schedules/user-agenda?userId=5&workDate=2026-04-28
```

**响应：** `{ schedules: [...], productionBatches: [...], repairOrders: [...] }`

---

## 五、交接班管理 `/handovers`

### 5.1 查询 / 5.2 新增 / 5.3 删除

```
GET    /handovers?pageNum=1&pageSize=10&batchId=
POST   /handovers  { "batchId": 101, "fromUserId": 5, "toUserId": 6, "handoverContext": "注意温度" }
DELETE /handovers/{handoverId}
```

> 新增交接班时，批次的 `operatorId` 自动更新为接班人

---

## 六、数据库变更（需执行）

```sql
-- sys_user 添加 team_id
ALTER TABLE sys_user ADD COLUMN team_id bigint DEFAULT NULL COMMENT '所属班组ID' AFTER employee_no;

-- mes_shift_schedule 改造为日期范围模式
ALTER TABLE mes_shift_schedule CHANGE work_date start_date date NOT NULL COMMENT '排班开始日期';
ALTER TABLE mes_shift_schedule ADD COLUMN end_date date NOT NULL COMMENT '排班结束日期' AFTER start_date;
ALTER TABLE mes_shift_schedule ADD COLUMN repeat_days varchar(20) DEFAULT NULL COMMENT '重复星期几,逗号分隔:1=周一,7=周日,空=每天' AFTER end_date;
```

---

## 七、业务场景

### 场景1：按班组排班（最常用）

```
1. POST /teams  → 建班组（A组、B组）
2. PUT /teams/{teamId}/assign?userId=5  → 分配成员
3. POST /schedules/batch-by-team?teamId=1&shiftId=1&startDate=2026-04-28&endDate=2026-05-31&repeatDays=1,2,3,4,5
   → A组全员工作日上早班
4. POST /schedules/batch-by-team?teamId=2&shiftId=2&startDate=2026-04-28&endDate=2026-05-31&repeatDays=1,2,3,4,5
   → B组全员工作日上晚班
```

### 场景2：查今天谁上班 → 安排生产

```
1. GET /schedules/daily?workDate=2026-04-28&shiftId=1 → 今天早班排了谁
2. POST /work-orders/{woId}/start-batch?operatorId=5&batchTargetQty=500
```

### 场景3：找空闲人修设备

```
1. GET /schedules/available-users?workDate=2026-04-28 → 今天谁没排班
2. POST /repair-orders { equipId: 1, repairUser: "王五" }
```

### 场景4：生产中途交接班

```
POST /handovers { batchId: 101, fromUserId: 5, toUserId: 6, handoverContext: "设备正常" }
→ 批次操作员自动切换
```

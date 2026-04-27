# 工单管理 API 文档（新版）

> 基于 `mes_work_order`（工单计划表）+ `mes_production_batch`（生产执行批次表）两表模型。  
> 一个工单可分多批次生产，每个批次独立启动/报工/完成。  
> 下订单时选择产品、配方、客户，下单后可自由分批生产。

---

## 一、数据模型

### mes_work_order 工单计划表

| 字段 | 类型 | 说明 |
|------|------|------|
| wo_id | bigint | 主键 |
| wo_no | varchar(50) | 工单号，自动生成（WO+yyyyMMdd+4位流水） |
| p_id | bigint | 产品ID |
| customer_id | bigint | 客户ID |
| recipe_id | bigint | 关联配方ID |
| target_qty | int | 计划生产总数量 |
| completed_qty | int | 已累计完工合格数 |
| status | tinyint | 0-待生产, 1-生产中, 2-已完成, 3-已关闭 |
| planned_start | datetime | 计划开始时间 |
| planned_end | datetime | 计划结束时间 |
| create_time | datetime | 创建时间 |

### mes_production_batch 生产执行批次表

| 字段 | 类型 | 说明 |
|------|------|------|
| batch_id | bigint | 主键 |
| batch_no | varchar(50) | 批次号（B+yyyyMMddHHmmssSSS） |
| wo_id | bigint | 关联工单ID |
| operator_id | bigint | 当班操作员ID |
| target_qty | int | 本批次计划产量 |
| actual_qty | int | 本批次实际产出数(含不良品) |
| bad_qty | int | 本批次不良品数 |
| start_time | datetime | 批次开始时间 |
| end_time | datetime | 批次结束时间 |
| batch_status | tinyint | 1-运行中, 2-已停止 |
| create_time | datetime | 创建时间 |

---

## 二、业务流程

```
1. 下订单: POST /work-orders (选择产品、配方、客户、计划产量)
2. 分批生产: POST /work-orders/{woId}/start-batch?batchTargetQty=500 (指定本批次产量)
3. 批次报工: POST /work-orders/batches/{batchId}/report?actualQty=100&badQty=5
4. 完成批次: POST /work-orders/batches/{batchId}/complete
5. 继续下一批: 重复步骤2-4，直到completedQty >= targetQty
6. 关闭工单: POST /work-orders/{woId}/close
```

---

## 三、工单 CRUD 接口

### 3.1 分页查询工单列表

```
GET /work-orders?pageNum=1&pageSize=10&searchKey=&pId=&status=
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页大小，默认10 |
| searchKey | string | 否 | 按工单号模糊搜索 |
| pId | long | 否 | 按产品ID筛选 |
| status | byte | 否 | 按状态筛选 |

**响应示例**

```json
{
  "code": 1,
  "data": {
    "records": [
      {
        "woId": 1,
        "woNo": "WO202604270001",
        "pId": 10,
        "productName": "橙汁500ml",
        "customerId": 5,
        "customerName": "XX经销商",
        "recipeId": 5,
        "recipeName": "橙汁标准配方",
        "targetQty": 1000,
        "completedQty": 500,
        "status": 1,
        "statusLabel": "生产中",
        "plannedStart": "2026-04-27 08:00:00",
        "plannedEnd": "2026-04-28 18:00:00",
        "createTime": "2026-04-27 07:30:00",
        "batchCount": 2
      }
    ],
    "total": 1
  }
}
```

---

### 3.2 工单详情

```
GET /work-orders/{woId}
```

**响应示例**

```json
{
  "code": 1,
  "data": {
    "woId": 1,
    "woNo": "WO202604270001",
    "pId": 10,
    "productName": "橙汁500ml",
    "customerId": 5,
    "customerName": "XX经销商",
    "recipeId": 5,
    "recipeName": "橙汁标准配方",
    "targetQty": 1000,
    "completedQty": 500,
    "status": 1,
    "statusLabel": "生产中",
    "batchList": [
      {
        "batchId": 101,
        "batchNo": "B20260427083000123",
        "operatorId": 5,
        "targetQty": 500,
        "actualQty": 520,
        "badQty": 20,
        "goodQty": 500,
        "batchStatus": 2,
        "batchStatusLabel": "已停止",
        "startTime": "2026-04-27 08:30:00",
        "endTime": "2026-04-27 16:00:00",
        "consumptionList": [
          {
            "consId": 1001,
            "lotNo": "INM20260425100000",
            "mId": 257,
            "consumeQty": 200.0,
            "uom": "kg",
            "feedTime": "2026-04-27 08:30:01",
            "sourceType": 1,
            "sourceTypeLabel": "系统自动"
          }
        ]
      },
      {
        "batchId": 102,
        "batchNo": "B20260427160500456",
        "targetQty": 500,
        "actualQty": 0,
        "badQty": 0,
        "goodQty": 0,
        "batchStatus": 1,
        "batchStatusLabel": "运行中",
        "startTime": "2026-04-27 16:05:00",
        "consumptionList": []
      }
    ]
  }
}
```

---

### 3.3 新增工单（下订单）

```
POST /work-orders
Content-Type: application/json
```

**请求体**

```json
{
  "pId": 10,
  "customerId": 5,
  "recipeId": 5,
  "targetQty": 1000,
  "plannedStart": "2026-04-27T08:00:00",
  "plannedEnd": "2026-04-28T18:00:00"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pId | long | 是 | 产品ID |
| customerId | long | 否 | 客户ID |
| recipeId | long | 是 | 配方ID |
| targetQty | int | 是 | 计划产量（>0） |
| plannedStart | datetime | 否 | 计划开始 |
| plannedEnd | datetime | 否 | 计划结束 |

> woNo 由后端自动生成，格式：`WO` + yyyyMMdd + 4位流水号

---

### 3.4 修改工单

```
PUT /work-orders/{woId}  (或 PUT /work-orders)
```

> 仅**待生产**（status=0）状态可修改

---

### 3.5 删除工单

```
DELETE /work-orders/{woId}
```

> 仅**待生产**（status=0）状态可删除

---

### 3.6 关闭/结案工单

```
POST /work-orders/{woId}/close
```

---

## 四、批次操作接口

### 4.1 启动新批次（分批生产）

```
POST /work-orders/{woId}/start-batch?operatorId=5&batchTargetQty=500
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| operatorId | long | 否 | 操作员ID |
| batchTargetQty | int | 否 | 本批次计划产量。不传则默认生产全部剩余产量。不能超过剩余产量 |

**业务逻辑：**
1. 校验工单状态（非已关闭、无运行中批次、还有剩余产量）
2. 校验 batchTargetQty ≤ 剩余产量
3. 预检库存齐套性（按本批次产量计算所需物料）
4. 自动生成批次号（`B` + yyyyMMddHHmmssSSS）
5. **FEFO 投料**：按过期日期升序消耗物料库存，多表同步扣减
6. 创建 `mes_production_batch` 记录
7. 工单状态更新为 1（生产中）
8. 写入 Redis 生产配置

**响应**

```json
{
  "code": 1,
  "data": "B20260427083000123"
}
```

---

### 4.2 批次报工

```
POST /work-orders/batches/{batchId}/report?actualQty=100&badQty=5
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| actualQty | int | 是 | 本次产出数量（增量累加） |
| badQty | int | 否 | 本次不良品数量，默认0 |

> 累加到批次记录的 actualQty / badQty，同步更新 Redis

---

### 4.3 完成批次

```
POST /work-orders/batches/{batchId}/complete
```

**业务逻辑：**
1. 批次状态改为 2（已停止），记录 endTime
2. 计算 goodQty = actualQty - badQty
3. 累加 goodQty 到工单的 `completed_qty`
4. 如果 `completed_qty >= target_qty`，工单状态变为 2（已完成）
5. 清除 Redis 生产配置
6. 自动生成产品待入库记录（`mes_product_receive`，state=0 待入库）

---

## 五、状态流转

### 工单状态

```
待生产(0) ──启动第1批──→ 生产中(1) ──所有批次完成──→ 已完成(2) ──手动关闭──→ 已关闭(3)
                            ↓
                      可继续开新批次
```

### 批次状态

```
运行中(1) ──完成批次──→ 已停止(2)
```

---

## 六、兼容旧接口

`/orders` 路径仍然可用，内部代理到新版服务。建议前端逐步迁移到 `/work-orders`。

---

## 七、产品出库（通过工单）

### 7.1 查询可出库的工单列表

```
GET /product-stock/shippable-orders
```

> 返回状态为生产中(1)或已完成(2)、且对应产品有库存的工单列表

**响应示例**

```json
{
  "code": 1,
  "data": [
    {
      "woId": 1,
      "woNo": "WO202604270001",
      "pId": 10,
      "productName": "橙汁500ml",
      "customerId": 5,
      "customerName": "XX经销商",
      "targetQty": 1000,
      "completedQty": 500,
      "currentStock": 300,
      "status": 1
    }
  ]
}
```

> 前端出库页面用此接口作为**工单下拉选择器**的数据源

---

### 7.2 产品出库

```
POST /product-stock/ship
Content-Type: application/json
```

**请求体**

```json
{
  "woId": 1,
  "quantity": 200,
  "operatorId": 5
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| woId | long | **是** | 工单ID（选择工单出库） |
| quantity | decimal | **是** | 出库数量 |
| pId | long | 否 | 产品ID，不传则从工单自动获取 |
| batchNo | string | 否 | 批次号，不传则自动取工单最近完成的批次 |
| customerName | string | 否 | 客户名，不传则从工单关联客户自动获取 |
| operatorId | long | 否 | 经办人ID |

**业务逻辑：**
1. 根据 woId 查询工单，自动获取产品ID、客户名、批次号
2. 校验产品库存是否充足
3. 写入出库记录（`mes_product_shipment`，含 wo_id、p_id）
4. 扣减产品库存（`mes_product_stock`）

---

### 7.3 查询出库记录

```
GET /product-stock/ship-records?pageNum=1&pageSize=10&batchNo=&customerName=
```

**响应字段：** shipId, shipNo, batchNo, woId, woNo, pId, productName, customerName, quantity, shipTime, operatorId

---

## 八、数据库变更（需执行）

```sql
-- mes_work_order 添加 customer_id 字段
ALTER TABLE mes_work_order ADD COLUMN customer_id bigint DEFAULT NULL COMMENT '客户ID' AFTER p_id;

-- mes_production_batch 添加 target_qty, actual_qty, bad_qty 字段
ALTER TABLE mes_production_batch ADD COLUMN target_qty int DEFAULT 0 COMMENT '本批次计划产量' AFTER operator_id;
ALTER TABLE mes_production_batch ADD COLUMN actual_qty int DEFAULT 0 COMMENT '本批次实际产出数' AFTER target_qty;
ALTER TABLE mes_production_batch ADD COLUMN bad_qty int DEFAULT 0 COMMENT '本批次不良品数' AFTER actual_qty;

-- mes_product_shipment 添加 wo_id, p_id 字段（出库关联工单）
ALTER TABLE mes_product_shipment ADD COLUMN wo_id bigint DEFAULT NULL COMMENT '关联工单ID' AFTER batch_no;
ALTER TABLE mes_product_shipment ADD COLUMN p_id bigint DEFAULT NULL COMMENT '产品ID' AFTER wo_id;
```

# 产品待入库管理 API 文档

## 概述

产品待入库模块实现 **工单完工 → 自动生成待入库记录（`mes_product_receive`, state=0）→ 手动上架入库到仓库库位** 的完整流程。

仅使用 `mes_product_receive` 一张表，通过 `state` 字段区分待入库(0)和已入库(1)。

### 流程图

```
工单完工 (completeOrder)
    │
    ▼ 自动写入 mes_product_receive (state=0)
mes_product_receive (入库记录, state=0 待入库)
    │
    ▼ 手动, 可多次
POST /product-pending/put-away
    │
    ├── wms_stock_lot (库位级库存)
    ├── mes_product_stock (总库存)
    └── mes_product_receive (全部入库后 state → 1)
```

**Base URL**: `/product-pending`

---

## 1. 查询待入库/已入库列表（分页）

### `GET /product-pending`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页条数 |
| pId | Long | 否 | - | 按产品筛选 |
| state | Byte | 否 | - | `0`-待入库，`1`-已入库 |

#### 成功响应

```json
{
  "code": 1,
  "data": {
    "records": [
      {
        "receiveId": 2048000000000000001,
        "receiveNo": "RCV20260426170015042",
        "batchNo": "B20260426001",
        "pId": 50,
        "pCode": "PRD000001",
        "pName": "果汁饮料500ml",
        "quantity": 5000.00,
        "putAwayQty": 3000.00,
        "pendingQty": 2000.00,
        "uom": "瓶",
        "state": 0,
        "stateLabel": "待入库",
        "createTime": "2026-04-26 17:00:15"
      }
    ],
    "total": 1,
    "pages": 1,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

---

## 2. 查询详情

### `GET /product-pending/{receiveId}`

#### 成功响应

```json
{
  "code": 1,
  "data": {
    "receiveId": 2048000000000000001,
    "receiveNo": "RCV20260426170015042",
    "batchNo": "B20260426001",
    "pId": 50,
    "pCode": "PRD000001",
    "pName": "果汁饮料500ml",
    "quantity": 5000.00,
    "putAwayQty": 3000.00,
    "pendingQty": 2000.00,
    "uom": "瓶",
    "state": 0,
    "stateLabel": "待入库",
    "createTime": "2026-04-26 17:00:15"
  }
}
```

---

## 3. 产品上架入位

### `POST /product-pending/put-away`

将待入库产品分配到指定仓库库位。**同一条记录可多次调用**，分配到不同仓库和库位，直到全部入库完毕。

每次调用会联动：
- `wms_stock_lot` — 写入库位级库存
- `mes_product_stock` — 累加产品总库存
- `mes_product_receive` — 全部入库后 state 更新为 1

#### 请求体 (JSON)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| receiveId | Long | ✅ | 入库记录ID (`mes_product_receive.receive_id`) |
| whId | Long | ✅ | 目标仓库ID |
| locId | Long | ✅ | 目标库位ID |
| quantity | BigDecimal | ✅ | 入库数量（不能超过待入库余量）|

#### 请求示例

```json
// 第一次：3000瓶放到 A仓 A-01-01
{ "receiveId": 2048000000000000001, "whId": 100, "locId": 201, "quantity": 3000.00 }

// 第二次：2000瓶放到 B仓 B-02-03
{ "receiveId": 2048000000000000001, "whId": 200, "locId": 305, "quantity": 2000.00 }
```

#### 成功响应

```json
{ "code": 1, "msg": null, "data": null }
```

#### 失败响应

```json
{ "code": 0, "msg": "产品入库失败: 入库数量超出待入库数量，当前可入库: 2000.00", "data": null }
```

---

## 自动触发说明

当工单完成生产时（`POST /orders/{woId}/complete`），系统自动：

1. 计算良品数量 = `actualQty - badQty`
2. 在 `mes_product_receive` 中插入一条记录（`state=0` 待入库）
3. 自动生成入库编号（格式 `RCV` + `yyyyMMddHHmmss` + 3位随机数）

---

## 数据字典

### state 入库状态

| 值 | 说明 |
|----|------|
| 0 | 待入库（工单刚完工，尚未上架） |
| 1 | 已入库（已全部上架到库位） |

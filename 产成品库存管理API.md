# 产成品库存管理 API 文档

## 概述

产成品库存管理模块用于管理产品的入库、出库和库存查询，包括：

- **库存查询**：分页查看产品当前库存（关联产品名称、仓库名称）
- **入库**：产品完工入库，写入入库记录并增加库存
- **出库**：产品发货出库，写入出库记录并扣减库存
- **入库记录查询**：分页查看历史入库单
- **出库记录查询**：分页查看历史出库单

**Base URL**: `/product-stock`

---

## 1. 分页查询产品库存

### `GET /product-stock`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页条数 |
| pId | Long | 否 | - | 产品ID，筛选特定产品 |

#### 成功响应

```json
{
  "code": 1,
  "data": {
    "records": [
      {
        "stockId": 1,
        "pId": 100,
        "pCode": "PRD000001",
        "pName": "果汁饮料500ml",
        "quantity": 5000.00,
        "unit": "瓶",
        "lastStockInTime": "2026-04-26 15:00:00",
        "lastStockOutTime": null,
        "updateTime": "2026-04-26 15:00:00"
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

## 2. 产成品入库

### `POST /product-stock/receive`

入库后自动：① 写入入库记录（`mes_product_receive`）② 累加产品库存（`mes_product_stock`）

#### 请求体 (JSON)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pId | Long | ✅ | 产品ID |
| batchNo | String | 否 | 生产批次号 |
| whId | Long | 否 | 入库仓库ID（配合 locId 写入 `wms_stock_lot` 追踪库位）|
| locId | Long | 否 | 入库库位ID（配合 whId 写入 `wms_stock_lot` 追踪库位）|
| quantity | BigDecimal | ✅ | 入库数量 |
| uom | String | 否 | 单位（瓶/箱），不传则取产品默认单位 |
| operatorId | Long | 否 | 入库员ID |

#### 请求示例

```json
{
  "pId": 100,
  "batchNo": "B20260426001",
  "quantity": 2000,
  "uom": "瓶"
}
```

#### 成功响应

```json
{ "code": 1, "msg": null, "data": null }
```

#### 失败响应

```json
{ "code": 0, "msg": "产品入库失败: 仓库不存在", "data": null }
```

> **入库编号**：自动生成，格式 `RCV` + `yyyyMMddHHmmss` + 3位随机数

---

## 3. 产成品出库

### `POST /product-stock/ship`

出库后自动：① 写入出库记录（`mes_product_shipment`）② 扣减产品库存

#### 请求体 (JSON)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pId | Long | ✅ | 产品ID（用于定位库存扣减） |
| batchNo | String | 否 | 关联生产批次号 |
| quantity | BigDecimal | ✅ | 出库数量 |
| customerName | String | 否 | 收货客户名称 |
| operatorId | Long | 否 | 经办人ID |

#### 请求示例

```json
{
  "pId": 100,
  "batchNo": "B20260426001",
  "quantity": 500,
  "customerName": "华东经销商A"
}
```

#### 成功响应

```json
{ "code": 1, "msg": null, "data": null }
```

#### 失败响应

```json
{ "code": 0, "msg": "产品出库失败: 库存不足，当前库存: 300", "data": null }
```

> **出库编号**：自动生成，格式 `SHP` + `yyyyMMddHHmmss` + 3位随机数

---

## 4. 查询入库记录

### `GET /product-stock/receive-records`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页条数 |
| pId | Long | 否 | - | 产品ID |
| batchNo | String | 否 | - | 批次号（模糊搜索） |

#### 成功响应

```json
{
  "code": 1,
  "data": {
    "records": [
      {
        "receiveId": 1,
        "receiveNo": "RCV20260426150015042",
        "batchNo": "B20260426001",
        "pId": 100,
        "pName": "果汁饮料500ml",
        "quantity": 2000.00,
        "uom": "瓶",
        "operatorId": 1,
        "createTime": "2026-04-26 15:00:15"
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

## 5. 查询出库记录

### `GET /product-stock/ship-records`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页条数 |
| batchNo | String | 否 | - | 批次号（模糊搜索） |
| customerName | String | 否 | - | 客户名称（模糊搜索） |

#### 成功响应

```json
{
  "code": 1,
  "data": {
    "records": [
      {
        "shipId": 1,
        "shipNo": "SHP20260426160030318",
        "batchNo": "B20260426001",
        "customerName": "华东经销商A",
        "quantity": 500.00,
        "shipTime": "2026-04-26 16:00:30",
        "operatorId": 1
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

## 数据表关系

```
mes_product (产品基础信息)
    │
    ├── mes_product_stock (实时库存，按 pId 汇总总量)
    │
    ├── mes_product_receive (入库记录，每次入库一条)
    │
    ├── mes_product_shipment (出库记录，每次出库一条)
    │
    └── wms_stock_lot (库位级库存明细，入库时传了 whId+locId 才写入)
```

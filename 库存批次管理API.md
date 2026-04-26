# 库存批次管理 API 文档

## 概述

库存批次管理模块（`wms_stock_lot`）用于管理原材料/产成品在仓库库位上的精确库存。支持：

- **入库**：将物料入库到指定仓库的指定库位
- **移库**：将物料从一个仓库库位转移到另一个仓库库位
- **库存汇总查询**：按物料+仓库维度查看汇总数量
- **库存明细查询**：按物料+仓库+库位维度查看批次级明细

**Base URL**: `/stock-lots`

---

## 1. 入库

### `POST /stock-lots/in`

将物料按批次入库到指定仓库的指定库位。

#### 请求体 (JSON)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | Long | ✅ | 物料ID（原材料 `mes_material.m_id` 或产成品 `mes_product.p_id`）|
| itemType | Byte | ✅ | 物料类型：`1`-原材料，`2`-产成品 |
| batchNo | String | 否 | 批次号（原材料LotNo 或 生产BatchNo）|
| whId | Long | ✅ | 目标仓库ID |
| locId | Long | ✅ | 目标库位ID |
| quantity | BigDecimal | ✅ | 入库数量 |
| unit | String | 否 | 计量单位（kg, 瓶, 箱等）|
| productionDate | String | 否 | 生产/进货日期，格式 `yyyy-MM-dd` |
| expiryDate | String | 否 | 有效期截止，格式 `yyyy-MM-dd` |
| qcStatus | Byte | 否 | 质量状态：`1`-合格，`2`-待检（默认），`3`-不合格 |

#### 请求示例

```json
{
  "itemId": 1001,
  "itemType": 1,
  "batchNo": "LOT20260426001",
  "whId": 2047601552604028930,
  "locId": 2047612345678901234,
  "quantity": 500.00,
  "unit": "kg",
  "productionDate": "2026-04-25",
  "expiryDate": "2027-04-25",
  "qcStatus": 1
}
```

#### 成功响应

```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

#### 失败响应

```json
{
  "code": 0,
  "msg": "入库失败: 库位不属于该仓库",
  "data": null
}
```

---

## 2. 移库

### `POST /stock-lots/transfer`

将指定库存批次记录中的一定数量从源库位转移到目标仓库的目标库位。

- 若移库数量等于源记录余量，则源记录删除
- 若目标库位已有相同物料+批次的记录，则合并数量

#### 请求体 (JSON)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lotStockId | Long | ✅ | 源库存批次记录ID |
| targetWhId | Long | ✅ | 目标仓库ID |
| targetLocId | Long | ✅ | 目标库位ID |
| transferQty | BigDecimal | ✅ | 移库数量（不能大于当前余量）|

#### 请求示例

```json
{
  "lotStockId": 2047700000000000001,
  "targetWhId": 2047610526015438849,
  "targetLocId": 2047612345678999999,
  "transferQty": 200.00
}
```

#### 成功响应

```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

#### 失败响应

```json
{
  "code": 0,
  "msg": "移库失败: 移库数量不能大于当前库存余量",
  "data": null
}
```

---

## 3. 库存汇总查询

### `GET /stock-lots/summary`

按 **物料 + 仓库** 维度汇总库存数量。可筛选特定物料或特定仓库。

#### 请求参数 (Query)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | Long | 否 | 物料ID |
| itemType | Byte | 否 | 物料类型：`1`-原材料，`2`-产成品 |
| whId | Long | 否 | 仓库ID |

#### 请求示例

```
GET /stock-lots/summary?itemId=1001&itemType=1
GET /stock-lots/summary?whId=2047601552604028930
GET /stock-lots/summary
```

#### 成功响应

```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "itemId": 1001,
      "itemType": 1,
      "itemName": "白砂糖",
      "whId": 2047601552604028930,
      "whName": "A仓",
      "totalQty": 1500.00,
      "unit": "kg"
    },
    {
      "itemId": 1001,
      "itemType": 1,
      "itemName": "白砂糖",
      "whId": 2047610526015438849,
      "whName": "B仓",
      "totalQty": 300.00,
      "unit": "kg"
    }
  ]
}
```

---

## 4. 库存批次库位明细查询（分页）

### `GET /stock-lots/detail`

按 **物料 + 仓库 + 库位** 维度查看每条批次记录的详细信息，支持分页。

#### 请求参数 (Query)

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页条数 |
| itemId | Long | 否 | - | 物料ID |
| itemType | Byte | 否 | - | 物料类型 |
| whId | Long | 否 | - | 仓库ID |
| locId | Long | 否 | - | 库位ID |

#### 请求示例

```
GET /stock-lots/detail?itemId=1001&whId=2047601552604028930&pageNum=1&pageSize=10
GET /stock-lots/detail?itemId=1001&whId=2047601552604028930&locId=2047612345678901234
```

#### 成功响应

```json
{
  "code": 1,
  "msg": null,
  "data": {
    "records": [
      {
        "lotStockId": 2047700000000000001,
        "itemId": 1001,
        "itemType": 1,
        "itemName": "白砂糖",
        "batchNo": "LOT20260426001",
        "whId": 2047601552604028930,
        "whName": "A仓",
        "locId": 2047612345678901234,
        "locCode": "A-01-05",
        "currentQty": 500.00,
        "unit": "kg",
        "productionDate": "2026-04-25",
        "expiryDate": "2027-04-25",
        "qcStatus": 1,
        "qcStatusLabel": "合格",
        "updateTime": "2026-04-26 10:30:00"
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

## 典型使用场景

### 场景1：原材料入库
前端选择原材料、目标仓库、目标库位，填写批次号和数量，调用 `POST /stock-lots/in`。

### 场景2：查看某原材料在各仓库的库存
调用 `GET /stock-lots/summary?itemId=1001&itemType=1`，返回该材料在各仓库的汇总数量。

### 场景3：展开查看某材料在某仓库的库位级明细
调用 `GET /stock-lots/detail?itemId=1001&whId=xxx`，返回该材料在该仓库每个库位上的批次明细。

### 场景4：移库
选择一条库存明细记录，填写目标仓库+库位和移库数量，调用 `POST /stock-lots/transfer`。

---

## 数据字典

### itemType 物料类型

| 值 | 说明 |
|----|------|
| 1 | 原材料 |
| 2 | 产成品 |

### qcStatus 质量状态

| 值 | 说明 |
|----|------|
| 1 | 合格 |
| 2 | 待检 |
| 3 | 不合格 |

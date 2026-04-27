# 库存批次管理 API 文档

## 概述

库存批次管理模块（`wms_stock_lot`）用于管理原材料/产成品在仓库库位上的精确库存。支持：

- **两步入库流程（推荐）**：先登记到货生成批次号 → 再分多次上架到不同仓库库位
- **一步入库（兼容旧接口）**：一次调用完成登记+上架
- **移库**：将物料从一个仓库库位转移到另一个仓库库位
- **库存汇总查询**：按物料+仓库维度查看汇总数量
- **库存明细查询**：按物料+仓库+库位维度查看批次级明细

**Base URL**: `/stock-lots`

---

## 1. 登记入库（第一步）

### `POST /stock-lots/register`

登记材料到货，自动生成入库批次号，写入 `mes_receipt` 并联动更新 `mes_material_stock` 总库存。

#### 请求体 (JSON)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | Long | ✅ | 物料ID |
| itemType | Byte | ✅ | `1`-原材料，`2`-产成品 |
| totalQuantity | BigDecimal | ✅ | 到货总数量 |
| unit | String | 否 | 计量单位，不传则取物料默认单位 |
| productionDate | String | 否 | 生产日期 `yyyy-MM-dd` |
| expiryDate | String | 否 | 有效期截止 `yyyy-MM-dd` |

#### 请求示例

```json
{
  "itemId": 1001,
  "itemType": 1,
  "supId": 10,
  "totalQuantity": 1000.00,
  "unit": "kg",
  "expiryDate": "2027-04-26"
}
```

#### 成功响应

```json
{
  "code": 1,
  "data": {
    "batchNo": "INM20260426150015042",
    "itemId": 1001,
    "itemType": 1,
    "itemName": "白砂糖",
    "totalQuantity": 1000.00,
    "putAwayQuantity": 0,
    "pendingQuantity": 1000.00,
    "unit": "kg",
    "expiryDate": "2027-04-26",
    "status": 0,
    "statusLabel": "待入库",
    "createTime": "2026-04-26 15:00:15"
  }
}
```

---

## 2. 上架入位（第二步）

### `POST /stock-lots/put-away`

使用第一步返回的批次号，将一定数量上架到指定仓库的指定库位。**同一批次可多次调用**，分配到不同位置，直到全部上架完毕。

#### 请求体 (JSON)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| batchNo | String | ✅ | 第一步返回的入库批次号 |
| whId | Long | ✅ | 目标仓库ID |
| locId | Long | ✅ | 目标库位ID |
| quantity | BigDecimal | ✅ | 上架数量（不能超过剩余待上架数量）|

#### 请求示例

```json
// 第一次上架：600kg 放到 A仓 A-01-01 库位
{ "batchNo": "INM20260426150015042", "whId": 100, "locId": 201, "quantity": 600.00 }

// 第二次上架：400kg 放到 B仓 B-02-03 库位
{ "batchNo": "INM20260426150015042", "whId": 200, "locId": 305, "quantity": 400.00 }
```

#### 成功响应

```json
{ "code": 1, "msg": null, "data": null }
```

#### 失败响应

```json
{ "code": 0, "msg": "上架入位失败: 上架数量超出剩余待上架数量，当前可上架: 400.00", "data": null }
```

---

## 3. 查询批次登记 & 上架进度

### `GET /stock-lots/register/{batchNo}`

查看某批次的登记信息、已上架数量和待上架数量。

#### 成功响应

```json
{
  "code": 1,
  "data": {
    "batchNo": "INM20260426150015042",
    "itemId": 1001,
    "itemType": 1,
    "itemName": "白砂糖",
    "totalQuantity": 1000.00,
    "putAwayQuantity": 600.00,
    "pendingQuantity": 400.00,
    "unit": "kg",
    "expiryDate": "2027-04-26",
    "status": 0,
    "statusLabel": "待入库",
    "createTime": "2026-04-26 15:00:15"
  }
}
```

---

## 4. 一步入库（旧接口，保留兼容）

### `POST /stock-lots/in`

将物料按批次入库到指定仓库的指定库位。

#### 请求体 (JSON)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | Long | ✅ | 物料ID（原材料 `mes_material.m_id` 或产成品 `mes_product.p_id`）|
| itemType | Byte | ✅ | 物料类型：`1`-原材料，`2`-产成品 |
| batchNo | String | 否 | 批次号，不传则后端自动生成。规则：`INM`(原材料)/`INP`(产成品) + `yyyyMMddHHmmss` + 3位随机数，如 `INM20260426103015042` |
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

## 5. 移库

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

## 6. 库存汇总查询

### `GET /stock-lots/summary`

按 **物料 + 仓库** 维度汇总库存数量。可筛选特定物料或特定仓库。

#### 请求参数 (Query)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemCode | String | 否 | 物料编码（如 `MAT000003`、`PRD000001`），与 itemId 二选一 |
| itemId | Long | 否 | 物料ID（数字），与 itemCode 二选一 |
| itemType | Byte | 否 | 物料类型：`1`-原材料，`2`-产成品 |
| whId | Long | 否 | 仓库ID |

#### 请求示例

```
GET /stock-lots/summary?itemCode=MAT000003
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

## 7. 库存批次库位明细查询（分页）

### `GET /stock-lots/detail`

按 **物料 + 仓库 + 库位** 维度查看每条批次记录的详细信息，支持分页。

#### 请求参数 (Query)

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页条数 |
| itemCode | String | 否 | - | 物料编码（如 `MAT000003`），与 itemId 二选一 |
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
        "itemCode": "MAT000003",
        "itemName": "白砂糖",
        "batchNo": "INM20260426150015042",
        "supId": 10,
        "supName": "华南糖业",
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
        "receiptStatus": 1,
        "receiptStatusLabel": "已入库",
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

### 场景1：两步入库（推荐流程）
1. 材料到货 → 调用 `POST /stock-lots/register`，登记物料和数量，获得批次号 `INM20260426150015042`
2. 分拣上架 → 调用 `POST /stock-lots/put-away`，600kg 放 A仓 A-01-01
3. 继续上架 → 再调用 `POST /stock-lots/put-away`，400kg 放 B仓 B-02-03
4. 查看进度 → 调用 `GET /stock-lots/register/INM20260426150015042`，确认全部上架完毕

### 场景2：查看某原材料在各仓库的库存
调用 `GET /stock-lots/summary?itemCode=MAT000003`，返回该材料在各仓库的汇总数量。

### 场景3：展开查看某材料在某仓库的库位级明细
调用 `GET /stock-lots/detail?itemCode=MAT000003&whId=xxx`，返回该材料在该仓库每个库位上的批次明细。

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

# 仓库与库位管理 API 文档

## 1. 模块说明

- 模块名称：仓库与库位管理（WMS）
- 控制器：`WarehouseController.java`, `LocationController.java`
- 基础路径：`/warehouses`, `/warehouses/{whId}/locations`
- 返回结构：`Result<T>`

---

## 2. 仓库管理 (Warehouse)

### 2.1 分页查询仓库列表
- **Method**: `GET`
- **Path**: `/warehouses`
- **Query 参数**:
  - `pageNum` (int, 可选, 默认 1)
  - `pageSize` (int, 可选, 默认 10)
  - `searchKey` (string, 可选, 仓库编码/名称)
  - `whType` (byte, 可选, 仓库类型)

### 2.2 查询所有仓库列表（不分页）
- **Method**: `GET`
- **Path**: `/warehouses/all`
- **说明**: 适合前端下拉框使用。

### 2.3 获取仓库详情
- **Method**: `GET`
- **Path**: `/warehouses/{whId}`

### 2.4 新增仓库
- **Method**: `POST`
- **Path**: `/warehouses`
- **Body (`WarehouseDTO`)**:
  - `whName` (string, 必填, 仓库名称)
  - `whType` (byte, 可选, 1-原料仓 2-成品仓 3-其他)
- **备注**: 后端自动生成 `whCode`。

### 2.5 修改仓库
- **Method**: `PUT`
- **Path**: `/warehouses/{whId}`
- **Body (`WarehouseDTO`)**: 同新增。

### 2.6 删除仓库
- **Method**: `DELETE`
- **Path**: `/warehouses/{whId}`

---

## 3. 库位管理 (Location)

### 3.1 分页查询库位列表
- **Method**: `GET`
- **Path**: `/warehouses/{whId}/locations`
- **Path 参数**:
  - `whId` (long, 必填, 仓库ID)
- **Query 参数**:
  - `pageNum` (int, 可选, 默认 1)
  - `pageSize` (int, 可选, 默认 10)
  - `searchKey` (string, 可选, 库位编码)
  - `locType` (byte, 可选, 库位类型)
  - `isActive` (byte, 可选, 1-可用 0-禁用)
  - `status` (byte, 可选, 0-空闲 1-占用 2-满载)

### 3.2 获取库位详情
- **Method**: `GET`
- **Path**: `/warehouses/{whId}/locations/{locId}`
- **Path 参数**:
  - `whId` (long, 必填, 仓库ID)
  - `locId` (long, 必填, 库位ID)

### 3.3 新增库位
- **Method**: `POST`
- **Path**: `/warehouses/{whId}/locations`
- **Path 参数**:
  - `whId` (long, 必填, 归属哪个仓库)
- **Body (`LocationDTO`)**:
  - `locCode` (string, 必填, 库位编码，例: A-01-05)
  - `locType` (byte, 可选, 1-常温 2-冷藏 3-危险品)
  - `maxCapacity` (decimal, 可选, 最大容量)
  - `currentLoad` (decimal, 可选, 当前承重)
  - `isActive` (byte, 可选, 默认1)
  - `status` (byte, 可选, 默认0)

### 3.4 修改库位
- **Method**: `PUT`
- **Path**: `/warehouses/{whId}/locations/{locId}`
- **Path 参数**:
  - `whId` (long, 必填, 仓库ID)
  - `locId` (long, 必填, 库位ID)
- **Body (`LocationDTO`)**: 同新增。

### 3.5 删除库位
- **Method**: `DELETE`
- **Path**: `/warehouses/{whId}/locations/{locId}`
- **Path 参数**:
  - `whId` (long, 必填, 仓库ID)
  - `locId` (long, 必填, 库位ID)

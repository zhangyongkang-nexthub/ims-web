# 客户管理 API 文档

## 1. 模块说明

- 模块名称：客户管理
- 控制器：`ims-server/src/main/java/com/ims/controller/CustomerController.java`
- 基础路径：`/customers`
- 返回结构：`Result<T>`

---

## 2. 通用返回结构

```json
{
  "code": 1,
  "msg": "success",
  "data": {}
}
```

字段说明：

- `code`：状态码，`1` 表示成功，`0` 表示失败
- `msg`：提示信息
- `data`：返回数据，可能为对象、分页对象或 `null`

---

## 3. 接口清单

| 接口 | 方法 | 路径 | 说明 |
|---|---|---|---|
| 分页查询客户 | GET | `/customers` | 按条件分页查询客户列表 |
| 查询客户详情 | GET | `/customers/{custId}` | 根据客户ID查询详情 |
| 新增客户 | POST | `/customers` | 新增客户信息 |
| 修改客户 | PUT | `/customers/{custId}` | 根据客户ID修改客户信息 |
| 删除客户 | DELETE | `/customers/{custId}` | 根据客户ID删除客户 |

---

## 4. 接口详情

### 4.1 分页查询客户列表

- **Method**: `GET`
- **Path**: `/customers`

#### Query 参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页条数 |
| searchKey | string | 否 | - | 关键字（客户编码/客户名称） |
| searchStatus | byte | 否 | - | 状态筛选：`1` 启用，`0` 停用 |

#### 请求示例

```http
GET /customers?pageNum=1&pageSize=10&searchKey=CUST&searchStatus=1
```

#### 成功响应示例

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "total": 2,
    "records": [
      {
        "custId": 1,
        "custCode": "CUST-001",
        "custName": "华东经销商A",
        "custType": 1,
        "custTypeLabel": "经销商",
        "status": 1,
        "createTime": "2026-04-24 10:00:00"
      }
    ]
  }
}
```

#### 失败响应示例

```json
{
  "code": 0,
  "msg": "查询客户列表失败: xxx",
  "data": null
}
```

---

### 4.2 查询客户详情

- **Method**: `GET`
- **Path**: `/customers/{custId}`

#### Path 参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| custId | long | 是 | 客户ID |

#### 请求示例

```http
GET /customers/1
```

#### 成功响应示例

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "custId": 1,
    "custCode": "CUST-001",
    "custName": "华东经销商A",
    "custType": 1,
    "custTypeLabel": "经销商",
    "contactPerson": "张三",
    "contactPhone": "13800000000",
    "address": "上海市浦东新区XX路",
    "status": 1,
    "createTime": "2026-04-24 10:00:00",
    "updateTime": "2026-04-24 10:30:00"
  }
}
```

#### 客户不存在示例

```json
{
  "code": 0,
  "msg": "客户不存在",
  "data": null
}
```

#### 失败响应示例

```json
{
  "code": 0,
  "msg": "获取客户详情失败: xxx",
  "data": null
}
```

---

### 4.3 新增客户

- **Method**: `POST`
- **Path**: `/customers`
- **Content-Type**: `application/json`

#### Body 参数（`CustomerDTO`）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| custCode | string | 否 | 客户编码（建议唯一） |
| custName | string | 是 | 客户名称（不能为空） |
| custType | byte | 否 | 客户类型：`1` 经销商，`2` 直营店，`3` 其他 |
| contactPerson | string | 否 | 联系人 |
| contactPhone | string | 否 | 联系电话 |
| address | string | 否 | 地址 |
| status | byte | 否 | 状态：`1` 启用，`0` 停用 |

#### 请求示例

```json
{
  "custCode": "CUST-002",
  "custName": "华南直营店B",
  "custType": 2,
  "contactPerson": "李四",
  "contactPhone": "13900000000",
  "address": "广州市天河区XX路",
  "status": 1
}
```

#### 成功响应示例

```json
{
  "code": 1,
  "msg": "success",
  "data": null
}
```

#### 参数校验失败示例

```json
{
  "code": 0,
  "msg": "客户名称不能为空",
  "data": null
}
```

#### 失败响应示例

```json
{
  "code": 0,
  "msg": "新增客户失败: xxx",
  "data": null
}
```

---

### 4.4 修改客户

- **Method**: `PUT`
- **Path**: `/customers/{custId}`
- **Content-Type**: `application/json`

#### Path 参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| custId | long | 是 | 客户ID |

#### Body 参数（`CustomerDTO`）

同“新增客户”。

> 说明：后端会使用路径参数 `custId` 覆盖请求体中的 `custId`。

#### 请求示例

```json
{
  "custCode": "CUST-002",
  "custName": "华南直营店B-更新",
  "custType": 2,
  "contactPerson": "王五",
  "contactPhone": "13700000000",
  "address": "广州市海珠区XX路",
  "status": 1
}
```

#### 成功响应示例

```json
{
  "code": 1,
  "msg": "success",
  "data": null
}
```

#### 参数校验失败示例

```json
{
  "code": 0,
  "msg": "客户名称不能为空",
  "data": null
}
```

#### 失败响应示例

```json
{
  "code": 0,
  "msg": "修改客户失败: xxx",
  "data": null
}
```

---

### 4.5 删除客户

- **Method**: `DELETE`
- **Path**: `/customers/{custId}`

#### Path 参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| custId | long | 是 | 客户ID |

#### 请求示例

```http
DELETE /customers/1
```

#### 成功响应示例

```json
{
  "code": 1,
  "msg": "success",
  "data": null
}
```

#### 失败响应示例

```json
{
  "code": 0,
  "msg": "删除客户失败: xxx",
  "data": null
}
```

---

## 5. 字段枚举说明

### 5.1 status

- `1`：启用
- `0`：停用

### 5.2 custType（当前实现映射）

- `1`：经销商
- `2`：直营店
- `3`：其他
- 其他/空：未知

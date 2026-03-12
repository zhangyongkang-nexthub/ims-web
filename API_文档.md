# IMS-System API 文档（全集）

版本: 1.2
更新时间: 2026-03-05
基础路径: http://localhost:8080

---

## 统一约定

### 认证
- 认证方式: JWT
- Header: `Authorization: Bearer <token>`

### 统一响应
```json
{
  "code": 1,
  "msg": null,
  "data": {}
}
```
- `code`: 1-成功, 0-失败

### 通用分页响应
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 2,
    "records": [
      {
        "id": 1,
        "name": "示例"
      }
    ]
  }
}
```

### 常见错误码约定
| code | 场景 | 说明 |
|---|---|---|
| 0 | 参数校验失败 | 必填字段缺失/格式不正确 |
| 0 | 业务校验失败 | 编码重复/状态不允许 |
| 0 | 资源不存在 | ID 不存在 |
| 0 | 系统异常 | 未捕获异常 |

### 编码自动生成规则
新增记录时，以下编码字段由后端自动生成，**前端无需传入**。修改时编码不可变更。

| 模块 | 字段 | 前缀 | 格式 | 示例 |
|---|---|---|---|---|
| 产品 | pCode | PRD | PRD + yyyyMMdd + 4位流水 | PRD202603050001 |
| 物料 | mCode | MAT | MAT + yyyyMMdd + 4位流水 | MAT202603050001 |
| 供应商 | supCode | SUP | SUP + yyyyMMdd + 4位流水 | SUP202603050001 |
| 配方 | recipeCode | RCP | RCP + yyyyMMdd + 4位流水 | RCP202603050001 |
| 进货批次 | lotNo | LOT | LOT + yyyyMMdd + 4位流水 | LOT202603050001 |
| 工位 | stationCode | STA | STA + yyyyMMdd + 4位流水 | STA202603050001 |
| 设备 | deviceCode | DEV | DEV + yyyyMMdd + 4位流水 | DEV202603050001 |
| 工单 | woCode | WO | WO + yyyyMMdd + 4位流水 | WO202603050001 |
| 批次号 | batchNo | B | B + yyyyMMdd + 3位流水 | B20260305001 |

---

## 1. 认证接口 (AuthController)

### 1.1 用户登录
- **POST** `/auth/login`
- **请求体**
```json
{
  "username": "admin",
  "password": "123456"
}
```
- **响应**
```json
{
  "code": 1,
  "msg": null,
  "data": "Bearer <jwt>"
}
```

---

## 2. 用户管理 (UserController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/users` | 分页查询用户 |
| GET | `/users/{userId}` | 用户详情 |
| POST | `/users` | 新增用户 |
| PUT | `/users/{userId}` | 修改用户 |
| DELETE | `/users/{userId}` | 删除用户 |

### 查询列表
- **GET** `/users?pageNum=1&pageSize=10&searchKey=admin&searchStatus=1`
- 参数: `pageNum`, `pageSize`, `searchKey`, `searchStatus`
- 请求示例
```http
GET /users?pageNum=1&pageSize=10&searchKey=admin&searchStatus=1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 3,
    "records": [
      {
        "id": 1,
        "username": "admin",
        "nickname": "管理员",
        "employeeNo": "EMP001",
        "status": true,
        "createTime": "2026-02-02 19:00:00",
        "updateTime": "2026-02-02 19:00:00",
        "roles": [
          {
            "roleId": 1,
            "roleName": "管理员",
            "roleKey": "admin"
          }
        ],
        "permissions": ["sys:user:list", "sys:user:add", "sys:user:edit", "sys:user:delete"]
      }
    ]
  }
}
```

### 获取详情
- **GET** `/users/{userId}`
- 请求示例
```http
GET /users/1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "employeeNo": "EMP001",
    "status": true,
    "createTime": "2026-02-02 19:00:00",
    "updateTime": "2026-02-02 19:00:00",
    "roles": [
      {
        "roleId": 1,
        "roleName": "管理员",
        "roleKey": "admin"
      }
    ],
    "permissions": ["sys:user:list", "sys:user:add", "sys:user:edit", "sys:user:delete"]
  }
}
```

### 新增用户
- **POST** `/users`
- 请求示例
```http
POST /users
Content-Type: application/json

{
  "username": "newuser",
  "password": "123456",
  "nickname": "新用户",
  "employeeNo": "EMP009",
  "status": true,
  "roleIds": [2]
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 修改用户
- **PUT** `/users/{userId}`
- 请求示例
```http
PUT /users/1
Content-Type: application/json

{
  "nickname": "管理员(改)",
  "status": true,
  "roleIds": [1]
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除用户
- **DELETE** `/users/{userId}`
- 请求示例
```http
DELETE /users/3
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 3. 角色管理 (RoleController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/roles` | 查询所有角色 |
| GET | `/roles/{roleId}` | 角色详情(含权限) |
| POST | `/roles` | 新增角色 |
| PUT | `/roles/{roleId}` | 修改角色 |
| DELETE | `/roles/{roleId}` | 删除角色 |
| POST | `/roles/assignPerms` | 分配权限 |
| GET | `/roles/{roleId}/permissions` | 获取权限标识 |

### 查询列表
- **GET** `/roles`
- 请求示例
```http
GET /roles
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "roleName": "管理员",
      "roleKey": "admin"
    }
  ]
}
```

### 获取详情
- **GET** `/roles/{roleId}`
- 请求示例
```http
GET /roles/1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "roleId": 1,
    "roleName": "管理员",
    "roleKey": "admin",
    "menuIds": [1, 2, 3],
    "permissions": ["sys:user:list", "sys:user:add"]
  }
}
```

### 新增角色
- **POST** `/roles`
- 请求示例
```http
POST /roles
Content-Type: application/json

{
  "roleName": "审核员",
  "roleKey": "reviewer"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 修改角色
- **PUT** `/roles/{roleId}`
- 请求示例
```http
PUT /roles/1
Content-Type: application/json

{
  "roleName": "超级管理员",
  "roleKey": "superadmin"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除角色
- **DELETE** `/roles/{roleId}`
- 请求示例
```http
DELETE /roles/3
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 分配权限
- **POST** `/roles/assignPerms`
- 请求示例
```http
POST /roles/assignPerms
Content-Type: application/json

{
  "roleId": 1,
  "menuIds": [1, 2, 3]
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 获取权限标识
- **GET** `/roles/{roleId}/permissions`
- 请求示例
```http
GET /roles/1/permissions
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": ["sys:user:list", "sys:user:add"]
}
```

---

## 4. 菜单/权限管理 (MenuController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/menus` | 查询所有菜单 |
| GET | `/menus/tree` | 菜单树 |
| GET | `/menus/permissions` | 权限标识列表 |
| POST | `/menus` | 新增菜单 |
| PUT | `/menus/{menuId}` | 修改菜单 |
| DELETE | `/menus/{menuId}` | 删除菜单 |

### 查询列表
- **GET** `/menus`
- 请求示例
```http
GET /menus
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "parentId": 0,
      "menuName": "系统管理",
      "path": "/system",
      "component": null,
      "perms": null,
      "menuType": "M"
    }
  ]
}
```

### 获取菜单树
- **GET** `/menus/tree`
- 请求示例
```http
GET /menus/tree
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "parentId": 0,
      "menuName": "系统管理",
      "path": "/system",
      "component": null,
      "perms": null,
      "menuType": "M",
      "children": [
        {
          "id": 2,
          "parentId": 1,
          "menuName": "用户管理",
          "path": "/system/user",
          "component": "system/user/index",
          "perms": null,
          "menuType": "C"
        }
      ]
    }
  ]
}
```

### 获取权限标识
- **GET** `/menus/permissions`
- 请求示例
```http
GET /menus/permissions
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": ["sys:user:list", "sys:user:add"]
}
```

### 新增菜单
- **POST** `/menus`
- 请求示例
```http
POST /menus
Content-Type: application/json

{
  "parentId": 1,
  "menuName": "数据统计",
  "path": "/system/report",
  "component": "system/report/index",
  "perms": "sys:report:list",
  "menuType": "C"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 修改菜单
- **PUT** `/menus/{menuId}`
- 请求示例
```http
PUT /menus/2
Content-Type: application/json

{
  "menuName": "用户管理(改)",
  "path": "/system/user",
  "component": "system/user/index",
  "menuType": "C"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除菜单
- **DELETE** `/menus/{menuId}`
- 请求示例
```http
DELETE /menus/18
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 5. 供应商管理 (SupplierController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/suppliers` | 分页查询 |
| GET | `/suppliers/{supId}` | 详情 |
| POST | `/suppliers` | 新增 |
| PUT | `/suppliers/{supId}` | 修改 |
| DELETE | `/suppliers/{supId}` | 删除 |

### 查询列表
- **GET** `/suppliers?pageNum=1&pageSize=10&searchKey=茶粉&searchStatus=1`
- 请求示例
```http
GET /suppliers?pageNum=1&pageSize=10&searchKey=茶粉&searchStatus=1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 2,
    "records": [
      {
        "supId": 11,
        "supCode": "SUP202603050001",
        "supName": "茶粉供应商A",
        "supType": 1,
        "status": 1,
        "createTime": "2026-02-04 10:00:00"
      }
    ]
  }
}
```

### 获取详情
- **GET** `/suppliers/{supId}`
- 请求示例
```http
GET /suppliers/11
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "supId": 11,
    "supCode": "SUP202603050001",
    "supName": "茶粉供应商A",
    "supType": 1,
    "contactPerson": "张经理",
    "contactPhone": "13900000011",
    "status": 1,
    "createTime": "2026-02-04 10:00:00",
    "updateTime": "2026-02-04 10:00:00"
  }
}
```

### 新增供应商
- **POST** `/suppliers`
- 请求示例
```http
POST /suppliers
Content-Type: application/json

{
  "supName": "包材供应商C",
  "supType": 2,
  "contactPerson": "王经理",
  "contactPhone": "13900000013",
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 修改供应商
- **PUT** `/suppliers/{supId}`
- 请求示例
```http
PUT /suppliers/11
Content-Type: application/json

{
  "supName": "茶粉供应商A(改)",
  "supType": 1,
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除供应商
- **DELETE** `/suppliers/{supId}`
- 请求示例
```http
DELETE /suppliers/11
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 6. 物料管理 (MaterialController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/materials` | 分页查询 |
| GET | `/materials/{mId}` | 详情 |
| POST | `/materials` | 新增 |
| PUT | `/materials/{mId}` | 修改 |
| DELETE | `/materials/{mId}` | 删除 |

### 查询列表
- **GET** `/materials?pageNum=1&pageSize=10&searchKey=茶粉&searchStatus=1`
- 请求示例
```http
GET /materials?pageNum=1&pageSize=10&searchKey=茶粉&searchStatus=1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 2,
    "records": [
      {
        "mId": 210,
        "mCode": "MAT202603050001",
        "mName": "红茶粉",
        "mType": 1,
        "unit": "kg",
        "status": 1,
        "createTime": "2026-02-04 10:00:00"
      }
    ]
  }
}
```

### 获取详情
- **GET** `/materials/{mId}`
- 请求示例
```http
GET /materials/210
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "mId": 210,
    "mCode": "MAT202603050001",
    "mName": "红茶粉",
    "mType": 1,
    "unit": "kg",
    "shelfLife": 365,
    "specDesc": "食品级红茶粉",
    "status": 1
  }
}
```

### 新增物料
- **POST** `/materials`
- 请求示例
```http
POST /materials
Content-Type: application/json

{
  "mName": "白砂糖",
  "mType": 1,
  "unit": "kg",
  "shelfLife": 365,
  "specDesc": "食品级白砂糖",
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 修改物料
- **PUT** `/materials/{mId}`
- 请求示例
```http
PUT /materials/210
Content-Type: application/json

{
  "mName": "红茶粉(改)",
  "unit": "kg",
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除物料
- **DELETE** `/materials/{mId}`
- 请求示例
```http
DELETE /materials/210
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 7. 产品管理 (ProductController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/products` | 分页查询 |
| GET | `/products/{pId}` | 详情 |
| POST | `/products` | 新增 |
| PUT | `/products/{pId}` | 修改 |
| DELETE | `/products/{pId}` | 删除 |

### 查询列表
- **GET** `/products?pageNum=1&pageSize=10&searchKey=冰红茶&searchStatus=1`
- 请求示例
```http
GET /products?pageNum=1&pageSize=10&searchKey=冰红茶&searchStatus=1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 1,
    "records": [
      {
        "pId": 110,
        "pCode": "PRD202603050001",
        "pName": "冰红茶 500ml",
        "pSpec": "500ml/瓶",
        "pUnit": "瓶",
        "status": 1,
        "createTime": "2026-02-04 10:00:00"
      }
    ]
  }
}
```

### 获取详情
- **GET** `/products/{pId}`
- 请求示例
```http
GET /products/110
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "pId": 110,
    "pCode": "PRD202603050001",
    "pName": "冰红茶 500ml",
    "pSpec": "500ml/瓶",
    "pUnit": "瓶",
    "shelfLife": 365,
    "storageCondition": "常温避光",
    "status": 1
  }
}
```

### 新增产品
- **POST** `/products`
- 请求示例
```http
POST /products
Content-Type: application/json

{
  "pName": "冰红茶 330ml",
  "pSpec": "330ml/瓶",
  "pUnit": "瓶",
  "shelfLife": 365,
  "storageCondition": "常温避光",
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 修改产品
- **PUT** `/products/{pId}`
- 请求示例
```http
PUT /products/110
Content-Type: application/json

{
  "pName": "冰红茶 500ml(改)",
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除产品
- **DELETE** `/products/{pId}`
- 请求示例
```http
DELETE /products/110
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 8. 工位管理 (StationController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/stations` | 分页查询 |
| GET | `/stations/{stationId}` | 详情 |
| POST | `/stations` | 新增 |
| PUT | `/stations/{stationId}` | 修改 |
| DELETE | `/stations/{stationId}` | 删除 |

### 查询列表
- **GET** `/stations?pageNum=1&pageSize=10&searchKey=灌装&searchStatus=1`
- 请求示例
```http
GET /stations?pageNum=1&pageSize=10&searchKey=灌装&searchStatus=1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 2,
    "records": [
      {
        "stationId": 1,
        "stationCode": "STA202603050001",
        "stationName": "配料工位",
        "processType": "MIXING",
        "sortOrder": 1,
        "status": 1
      }
    ]
  }
}
```

### 获取详情
- **GET** `/stations/{stationId}`
- 请求示例
```http
GET /stations/2
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "stationId": 2,
    "stationCode": "STA202603050002",
    "stationName": "灌装工位",
    "processType": "FILLING",
    "sortOrder": 2,
    "status": 1
  }
}
```

### 新增工位
- **POST** `/stations`
- 请求示例
```http
POST /stations
Content-Type: application/json

{
  "stationName": "包装工位",
  "processType": "PACKING",
  "sortOrder": 3,
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 修改工位
- **PUT** `/stations/{stationId}`
- 请求示例
```http
PUT /stations/2
Content-Type: application/json

{
  "stationName": "灌装工位(改)",
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除工位
- **DELETE** `/stations/{stationId}`
- 请求示例
```http
DELETE /stations/2
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 9. 设备管理 (DeviceController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/devices` | 分页查询 |
| GET | `/devices/{deviceId}` | 详情 |
| POST | `/devices` | 新增 |
| PUT | `/devices/{deviceId}` | 修改 |
| DELETE | `/devices/{deviceId}` | 删除 |

### 查询列表
- **GET** `/devices?pageNum=1&pageSize=10&searchKey=PRESS&stationId=1`
- 请求示例
```http
GET /devices?pageNum=1&pageSize=10&searchKey=PRESS&stationId=1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 1,
    "records": [
      {
        "deviceId": 101,
        "stationId": 1,
        "deviceCode": "DEV202603050001",
        "deviceType": "PRESS",
        "deviceModel": "M-100",
        "status": 1
      }
    ]
  }
}
```

### 获取详情
- **GET** `/devices/{deviceId}`
- 请求示例
```http
GET /devices/101
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "deviceId": 101,
    "stationId": 1,
    "deviceCode": "DEV202603050001",
    "deviceType": "PRESS",
    "deviceModel": "M-100",
    "status": 1
  }
}
```

### 新增设备
- **POST** `/devices`
- 请求示例
```http
POST /devices
Content-Type: application/json

{
  "stationId": 2,
  "deviceType": "PRESS",
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 修改设备
- **PUT** `/devices/{deviceId}`
- 请求示例
```http
PUT /devices/101
Content-Type: application/json

{
  "deviceType": "PRESS",
  "deviceModel": "M-200",
  "status": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除设备
- **DELETE** `/devices/{deviceId}`
- 请求示例
```http
DELETE /devices/101
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 10. 进货批次管理 (MaterialLotController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/material-lots` | 分页查询（仅批次+物料/供应商信息，不含库存字段） |
| GET | `/material-lots/{lotId}` | 详情（仅批次+物料/供应商信息，不含库存字段） |
| POST | `/material-lots` | 新增（写批次，库存自动增加） |
| PUT | `/material-lots/{lotId}` | 修改（按差值调整库存；如更换物料，先回退旧物料再新增新物料） |
| DELETE | `/material-lots/{lotId}` | 删除/作废（回退库存，不足时报错） |

### 查询列表
- **GET** `/material-lots?pageNum=1&pageSize=10&searchKey=LOT2026&mId=210`
- 响应字段说明：`arrivalQty` 为批次进货量；不返回库存字段。
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 2,
    "records": [
      {
        "lotId": 1001,
        "lotNo": "LOT20260204001",
        "mId": 210,
        "supId": 11,
        "arrivalQty": 1000.000,
        "qcStatus": 1,
        "arrivalTime": "2026-02-04 10:00:00",
        "expiryDate": "2027-02-04"
      }
    ]
  }
}
```

### 获取详情
- **GET** `/material-lots/{lotId}`
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "lotId": 1001,
    "lotNo": "LOT20260204001",
    "mId": 210,
    "mName": "白砂糖",
    "supId": 11,
    "supName": "XX供应商",
    "arrivalQty": 1000.000,
    "qcStatus": 1,
    "arrivalTime": "2026-02-04 10:00:00",
    "expiryDate": "2027-02-04"
  }
}
```

### 新增批次
- **POST** `/material-lots`
- 说明：必填 `mId`、`arrivalQty`；`lotNo` 由后端自动生成；保存成功会把 `arrivalQty` 同步增加到库存表。
- 请求示例
```http
POST /material-lots
Content-Type: application/json

{
  "mId": 210,
  "supId": 11,
  "arrivalQty": 800,
  "qcStatus": 1,
  "arrivalTime": "2026-02-04T10:00:00",
  "expiryDate": "2027-02-04"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 修改批次
- **PUT** `/material-lots/{lotId}`
- 说明：可修改 `arrivalQty` 或 `mId`；库存按差值调整，若更换物料会回退旧物料库存后再增加新物料库存。
- 请求示例
```http
PUT /material-lots/1001
Content-Type: application/json

{
  "arrivalQty": 1200,
  "qcStatus": 1
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除批次
- **DELETE** `/material-lots/{lotId}`
- 说明：删除/作废会按该批次进货量回退库存，若库存不足则返回错误。
- 请求示例
```http
DELETE /material-lots/1001
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 10.x 库存查询 (MaterialStockController)

| 方法 | URL | 说明 |
|---|---|---|
| GET | `/material-stocks` | 查询库存（可按物料ID过滤） |

- **GET** `/material-stocks` 或 `/material-stocks?mId=210`
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "materialId": 210,
      "materialName": "白砂糖",
      "totalQuantity": 1800.0000,
      "minThreshold": null,
      "unit": "KG",
      "lastPurchaseDate": "2026-02-04T10:00:00",
      "createTime": "2026-02-04T10:00:00",
      "updateTime": "2026-02-04T12:00:00"
    }
  ]
}
```

---

## 11. 工艺方案管理 (CraftController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/crafts` | 分页查询工艺方案 |
| GET | `/crafts/{id}` | 工艺方案详情 |
| POST | `/crafts` | 新增工艺方案 |
| PUT | `/crafts/{id}` | 修改工艺方案 |
| DELETE | `/crafts/{id}` | 删除工艺方案 |

### 业务规则
- 工艺名称（`recipeName`）全局唯一，新增/修改时自动做重名检查，重复时返回 `"工艺名称已存在: xxx"`。
- 每个产品可以有多个工艺方案，但只能有一个默认方案（`isDefault=true`）。设为默认时自动将同产品下其他方案置为非默认。

### 查询列表
- **GET** `/crafts?pageNum=1&pageSize=10&searchKey=杀菌&productId=110&isDefault=true`
- 参数: `pageNum`, `pageSize`, `searchKey`(模糊匹配名称), `productId`, `isDefault`
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 2,
    "records": [
      {
        "id": 1,
        "productId": 110,
        "productName": "冰红茶 500ml",
        "recipeName": "夏季高温杀菌方案",
        "isDefault": true,
        "isDefaultLabel": "是",
        "remark": "适用于夏季高温环境",
        "createTime": "2026-03-05 10:00:00",
        "updateTime": "2026-03-05 10:00:00"
      },
      {
        "id": 2,
        "productId": 110,
        "productName": "冰红茶 500ml",
        "recipeName": "标准杀菌方案",
        "isDefault": false,
        "isDefaultLabel": "否",
        "remark": null,
        "createTime": "2026-03-05 09:00:00",
        "updateTime": "2026-03-05 09:00:00"
      }
    ]
  }
}
```

### 获取详情
- **GET** `/crafts/{id}`
- 请求示例
```http
GET /crafts/1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 1,
    "productId": 110,
    "productName": "冰红茶 500ml",
    "recipeName": "夏季高温杀菌方案",
    "isDefault": true,
    "isDefaultLabel": "是",
    "remark": "适用于夏季高温环境",
    "createTime": "2026-03-05 10:00:00",
    "updateTime": "2026-03-05 10:00:00"
  }
}
```

### 新增工艺方案
- **POST** `/crafts`
- 请求示例
```http
POST /crafts
Content-Type: application/json

{
  "productId": 110,
  "recipeName": "冬季低温杀菌方案",
  "isDefault": false,
  "remark": "适用于冬季低温环境"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```
- 错误示例（名称重复）
```json
{
  "code": 0,
  "msg": "工艺名称已存在: 冬季低温杀菌方案",
  "data": null
}
```

### 修改工艺方案
- **PUT** `/crafts/{id}`
- 请求示例
```http
PUT /crafts/1
Content-Type: application/json

{
  "productId": 110,
  "recipeName": "夏季高温杀菌方案(改)",
  "isDefault": true,
  "remark": "修改后的方案"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除工艺方案
- **DELETE** `/crafts/{id}`
- 请求示例
```http
DELETE /crafts/2
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 12. 工艺参数明细管理 (CraftDetailController)

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/craft-details` | 分页查询工艺参数明细 |
| GET | `/craft-details/{id}` | 工艺参数明细详情 |
| POST | `/craft-details` | 新增工艺参数明细 |
| PUT | `/craft-details/{id}` | 修改工艺参数明细 |
| DELETE | `/craft-details/{id}` | 删除工艺参数明细 |

### 业务规则
- 同一工艺方案下，`processType` + `parameterName` 不允许重复，重复时返回清晰错误信息。
- `processType` 对应工位的工序类型（如 MIXING、STERILIZING、FILLING）。
- `targetValue` 是给 Python 模拟器的基准值，`maxThreshold`/`minThreshold` 是看板报警的阈值范围。

### 字段说明
| 字段 | 类型 | 说明 |
|---|---|---|
| id | Long | 主键 |
| recipeId | Long | 关联工艺方案ID |
| processType | String | 工序类型（MIXING/STERILIZING/FILLING 等） |
| parameterName | String | 监控参数名称（temperature/brix/speed 等） |
| targetValue | BigDecimal | 目标值（模拟器基准值） |
| maxThreshold | BigDecimal | 上限阈值（超过报警） |
| minThreshold | BigDecimal | 下限阈值（低于报警） |
| unit | String | 物理单位（℃/Brix/瓶/分 等） |

### 查询列表
- **GET** `/craft-details?pageNum=1&pageSize=10&recipeId=1&processType=STERILIZING`
- 参数: `pageNum`, `pageSize`, `recipeId`, `processType`
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 3,
    "records": [
      {
        "id": 1,
        "recipeId": 1,
        "processType": "STERILIZING",
        "parameterName": "temperature",
        "targetValue": 95.00,
        "maxThreshold": 97.00,
        "minThreshold": 93.00,
        "unit": "℃"
      },
      {
        "id": 2,
        "recipeId": 1,
        "processType": "FILLING",
        "parameterName": "speed",
        "targetValue": 200.00,
        "maxThreshold": 220.00,
        "minThreshold": 180.00,
        "unit": "瓶/分"
      },
      {
        "id": 3,
        "recipeId": 1,
        "processType": "MIXING",
        "parameterName": "brix",
        "targetValue": 12.50,
        "maxThreshold": 13.00,
        "minThreshold": 12.00,
        "unit": "Brix"
      }
    ]
  }
}
```

### 获取详情
- **GET** `/craft-details/{id}`
- 请求示例
```http
GET /craft-details/1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 1,
    "recipeId": 1,
    "processType": "STERILIZING",
    "parameterName": "temperature",
    "targetValue": 95.00,
    "maxThreshold": 97.00,
    "minThreshold": 93.00,
    "unit": "℃"
  }
}
```

### 新增工艺参数明细
- **POST** `/craft-details`
- 请求示例
```http
POST /craft-details
Content-Type: application/json

{
  "recipeId": 1,
  "processType": "STERILIZING",
  "parameterName": "pressure",
  "targetValue": 2.5,
  "maxThreshold": 3.0,
  "minThreshold": 2.0,
  "unit": "MPa"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```
- 错误示例（参数重复）
```json
{
  "code": 0,
  "msg": "同一工艺方案下，工序[STERILIZING]的参数[pressure]已存在",
  "data": null
}
```

### 修改工艺参数明细
- **PUT** `/craft-details/{id}`
- 请求示例
```http
PUT /craft-details/1
Content-Type: application/json

{
  "recipeId": 1,
  "processType": "STERILIZING",
  "parameterName": "temperature",
  "targetValue": 96.00,
  "maxThreshold": 98.00,
  "minThreshold": 94.00,
  "unit": "℃"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除工艺参数明细
- **DELETE** `/craft-details/{id}`
- 请求示例
```http
DELETE /craft-details/3
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 13. 字典类型管理 (DictTypeController)

> 字典类型是字典体系的"分类"，如 `order_status`（工单状态）、`device_status`（设备状态）。
> 通过统一的字典表，保证全局业务逻辑中同一含义的状态值始终一致。

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/dict-types` | 查询全部字典类型 |
| GET | `/dict-types/{id}` | 字典类型详情 |
| POST | `/dict-types` | 新增字典类型 |
| PUT | `/dict-types/{id}` | 修改字典类型 |
| DELETE | `/dict-types/{id}` | 删除字典类型 |

### 业务规则
- `dictType`（字典类型编码）全局唯一，新增/修改时自动做唯一性校验，重复时返回 `"字典类型编码已存在: xxx"`。

### 字段说明
| 字段 | 类型 | 说明 |
|---|---|---|
| id | Long | 主键 |
| dictName | String | 字典名称（如：工单状态） |
| dictType | String | 字典类型编码（如：order_status），全局唯一 |
| remark | String | 备注 |

### 查询全部
- **GET** `/dict-types`
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "dictName": "工单状态",
      "dictType": "order_status",
      "remark": "工单生命周期状态"
    },
    {
      "id": 2,
      "dictName": "设备状态",
      "dictType": "device_status",
      "remark": "设备运行状态"
    },
    {
      "id": 3,
      "dictName": "物料类型",
      "dictType": "material_type",
      "remark": null
    }
  ]
}
```

### 获取详情
- **GET** `/dict-types/{id}`
- 请求示例
```http
GET /dict-types/1
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 1,
    "dictName": "工单状态",
    "dictType": "order_status",
    "remark": "工单生命周期状态"
  }
}
```

### 新增字典类型
- **POST** `/dict-types`
- 请求示例
```http
POST /dict-types
Content-Type: application/json

{
  "dictName": "供应商类型",
  "dictType": "supplier_type",
  "remark": "供应商分类"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```
- 错误示例（编码重复）
```json
{
  "code": 0,
  "msg": "字典类型编码已存在: supplier_type",
  "data": null
}
```

### 修改字典类型
- **PUT** `/dict-types/{id}`
- 请求示例
```http
PUT /dict-types/1
Content-Type: application/json

{
  "dictName": "工单状态(改)",
  "dictType": "order_status",
  "remark": "修改后的备注"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除字典类型
- **DELETE** `/dict-types/{id}`
- 请求示例
```http
DELETE /dict-types/3
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

---

## 14. 字典数据管理 (DictDataController)

> 字典数据是字典体系的"具体值"。前端下拉框、状态翻译等均通过 `dictType` 获取对应的数据列表。
> 例如：`order_status` 下有 `0-待排产`、`1-待生产`、`2-生产中`、`3-已完成`、`4-已关闭`。

### 接口清单
| 方法 | URL | 说明 |
|---|---|---|
| GET | `/dict-data?dictType=xxx` | 按字典类型编码查询数据列表（仅启用项，按排序号升序） |
| GET | `/dict-data/{id}` | 字典数据详情 |
| POST | `/dict-data` | 新增字典数据 |
| PUT | `/dict-data/{id}` | 修改字典数据 |
| DELETE | `/dict-data/{id}` | 删除字典数据 |

### 业务规则
- 同一 `dictType` 下，`dictValue` 不允许重复，重复时返回 `"字典类型[xxx]下键值[xxx]已存在"`。
- 列表查询只返回 `status=true`（启用）的数据项，按 `dictSort` 升序排列。

### 字段说明
| 字段 | 类型 | 说明 |
|---|---|---|
| id | Long | 主键 |
| dictType | String | 所属字典类型编码（关联 `mes_dict_type.dict_type`） |
| dictLabel | String | 显示标签（如：生产中） |
| dictValue | String | 存储键值（如：2），同一 dictType 下唯一 |
| dictSort | Integer | 排序号 |
| isDefault | Boolean | 是否默认值 |
| status | Boolean | 状态（true=启用，false=停用） |
| remark | String | 备注 |

### 按类型查询列表
- **GET** `/dict-data?dictType=order_status`
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": [
    {
      "id": 1,
      "dictType": "order_status",
      "dictLabel": "待排产",
      "dictValue": "0",
      "dictSort": 1,
      "isDefault": true,
      "status": true,
      "remark": null
    },
    {
      "id": 2,
      "dictType": "order_status",
      "dictLabel": "待生产",
      "dictValue": "1",
      "dictSort": 2,
      "isDefault": false,
      "status": true,
      "remark": null
    },
    {
      "id": 3,
      "dictType": "order_status",
      "dictLabel": "生产中",
      "dictValue": "2",
      "dictSort": 3,
      "isDefault": false,
      "status": true,
      "remark": null
    },
    {
      "id": 4,
      "dictType": "order_status",
      "dictLabel": "已完成",
      "dictValue": "3",
      "dictSort": 4,
      "isDefault": false,
      "status": true,
      "remark": null
    },
    {
      "id": 5,
      "dictType": "order_status",
      "dictLabel": "已关闭",
      "dictValue": "4",
      "dictSort": 5,
      "isDefault": false,
      "status": true,
      "remark": null
    }
  ]
}
```

### 获取详情
- **GET** `/dict-data/{id}`
- 请求示例
```http
GET /dict-data/3
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "id": 3,
    "dictType": "order_status",
    "dictLabel": "生产中",
    "dictValue": "2",
    "dictSort": 3,
    "isDefault": false,
    "status": true,
    "remark": null
  }
}
```

### 新增字典数据
- **POST** `/dict-data`
- 请求示例
```http
POST /dict-data
Content-Type: application/json

{
  "dictType": "order_status",
  "dictLabel": "异常中止",
  "dictValue": "5",
  "dictSort": 6,
  "isDefault": false,
  "status": true,
  "remark": "生产异常中止状态"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```
- 错误示例（键值重复）
```json
{
  "code": 0,
  "msg": "字典类型[order_status]下键值[5]已存在",
  "data": null
}
```

### 修改字典数据
- **PUT** `/dict-data/{id}`
- 请求示例
```http
PUT /dict-data/5
Content-Type: application/json

{
  "dictType": "order_status",
  "dictLabel": "已关闭(改)",
  "dictValue": "4",
  "dictSort": 5,
  "isDefault": false,
  "status": true,
  "remark": "修改后"
}
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 删除字典数据
- **DELETE** `/dict-data/{id}`
- 请求示例
```http
DELETE /dict-data/5
```
- 响应示例
```json
{
  "code": 1,
  "msg": null,
  "data": null
}
```

### 典型用法示例

前端在渲染工单列表时，先调用 `GET /dict-data?dictType=order_status` 获取状态映射表，然后用返回的 `dictValue → dictLabel` 对工单记录中的状态数字做翻译显示：

| 数据库存储值 | dictLabel（前端显示） |
|---|---|
| 0 | 待排产 |
| 1 | 待生产 |
| 2 | 生产中 |
| 3 | 已完成 |
| 4 | 已关闭 |

---

## 15. 备注
- 所有接口默认需携带 JWT Token。
- 若字段或表结构有变更，请以实体类与数据库为准。

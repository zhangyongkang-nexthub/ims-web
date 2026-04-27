# 设备与维修管理 API 文档

> 三张表：`eam_equipment`（生产设备）、`mes_device`（传感器，挂载于生产设备）、`eam_repair_order`（维修工单，仅针对生产设备）

---

## 一、数据关系

```
eam_equipment（生产设备）
  ├── mes_device（传感器） —— 通过 equip_id 挂载
  └── eam_repair_order（维修工单） —— 通过 equip_id 关联
```

---

## 二、生产设备管理 `/equipments`

### 2.1 分页查询设备列表

```
GET /equipments?pageNum=1&pageSize=10&searchKey=&stationId=&status=
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| searchKey | string | 否 | 按设备名称/编码模糊搜索 |
| stationId | long | 否 | 按工位筛选 |
| status | byte | 否 | 1-运行, 2-故障, 3-维保, 0-报废 |

**响应字段：** equipId, equipCode, equipName, model, stationId, stationName, status, statusLabel, installDate, expiryDate, createTime, sensorCount（挂载传感器数量）

---

### 2.2 设备详情（含挂载传感器列表）

```
GET /equipments/{equipId}
```

**响应示例**

```json
{
  "code": 1,
  "data": {
    "equipment": {
      "equipId": 1,
      "equipCode": "EQ001",
      "equipName": "1号灌装机",
      "model": "GZ-500",
      "stationId": 10,
      "stationName": "灌装工位",
      "status": 1,
      "statusLabel": "运行",
      "installDate": "2024-01-15",
      "expiryDate": "2034-01-15",
      "createTime": "2026-04-27 10:00:00"
    },
    "sensors": [
      {
        "deviceId": 101,
        "equipId": 1,
        "equipName": "1号灌装机",
        "deviceCode": "TEMP_SENSOR_01",
        "deviceType": "TEMP",
        "kafkaTopic": "ims.sensor.temp",
        "redisKey": "ims:sensor:TEMP_SENSOR_01",
        "status": 1,
        "statusLabel": "启用"
      }
    ]
  }
}
```

---

### 2.3 新增设备

```
POST /equipments
Content-Type: application/json
```

```json
{
  "equipCode": "EQ002",
  "equipName": "2号灌装机",
  "model": "GZ-500",
  "stationId": 10,
  "status": 1,
  "installDate": "2026-04-27",
  "expiryDate": "2036-04-27"
}
```

---

### 2.4 修改设备

```
PUT /equipments/{equipId}
```

---

### 2.5 删除设备

```
DELETE /equipments/{equipId}
```

> 如果设备下还有挂载的传感器，不允许删除

---

### 2.6 修改设备状态

```
PUT /equipments/{equipId}/status?status=2
```

| status | 说明 |
|--------|------|
| 0 | 报废 |
| 1 | 运行 |
| 2 | 故障 |
| 3 | 维保 |

---

## 三、传感器管理 `/devices`

### 3.1 分页查询传感器列表

```
GET /devices?pageNum=1&pageSize=10&searchKey=&stationId=
```

**响应字段：** deviceId, stationId, stationName, equipId, equipName, deviceCode, deviceType, kafkaTopic, redisKey, status, statusLabel

---

### 3.2 传感器详情

```
GET /devices/{deviceId}
```

---

### 3.3 新增传感器

```
POST /devices
Content-Type: application/json
```

```json
{
  "stationId": 10,
  "equipId": 1,
  "deviceCode": "TEMP_SENSOR_02",
  "deviceType": "TEMP",
  "kafkaTopic": "ims.sensor.temp",
  "redisKey": "ims:sensor:TEMP_SENSOR_02",
  "status": 1
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| stationId | long | 是 | 所属工位ID |
| equipId | long | 否 | 挂载的生产设备ID |
| deviceCode | string | 是 | 物理设备编码 |
| deviceType | string | 是 | TEMP/FLOW/PRESS |
| kafkaTopic | string | 否 | 数据Topic |
| redisKey | string | 否 | Redis缓存Key |
| status | byte | 否 | 1-启用, 0-停用 |

---

### 3.4 修改传感器

```
PUT /devices/{deviceId}
```

---

### 3.5 删除传感器

```
DELETE /devices/{deviceId}
```

---

## 四、设备维修工单管理 `/repair-orders`

> 维修工单仅针对**生产设备**（`eam_equipment`），不针对传感器

### 4.1 分页查询维修工单

```
GET /repair-orders?pageNum=1&pageSize=10&equipId=&status=&searchKey=
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| equipId | long | 否 | 按设备筛选 |
| status | byte | 否 | 0-待修, 1-维修中, 2-已完成 |
| searchKey | string | 否 | 按工单号/故障描述模糊搜索 |

**响应字段：** repairId, equipId, equipName, equipCode, orderNo, faultDesc, sourceType, sourceTypeLabel, priority, priorityLabel, repairUser, status, statusLabel, startTime, endTime, createTime

---

### 4.2 维修工单详情

```
GET /repair-orders/{repairId}
```

---

### 4.3 新增维修工单（报修）

```
POST /repair-orders
Content-Type: application/json
```

```json
{
  "equipId": 1,
  "faultDesc": "灌装精度偏移，溢出率超标",
  "sourceType": 1,
  "priority": 2,
  "repairUser": "张三"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| equipId | long | **是** | 生产设备ID |
| faultDesc | string | 否 | 故障描述 |
| sourceType | byte | 否 | 1-人工报修(默认), 2-AI自动触发 |
| priority | byte | 否 | 1-普通(默认), 2-紧急 |
| repairUser | string | 否 | 维修负责人 |

> - 工单号（orderNo）后端自动生成：`RPR` + yyyyMMddHHmmssSSS
> - 新增报修时，设备状态自动改为 **故障(2)**

---

### 4.4 修改维修工单

```
PUT /repair-orders/{repairId}
```

> 仅**待修(0)**状态可修改

---

### 4.5 删除维修工单

```
DELETE /repair-orders/{repairId}
```

> 仅**待修(0)**状态可删除，删除后设备状态恢复为**运行(1)**

---

### 4.6 开始维修

```
POST /repair-orders/{repairId}/start
```

> 设备状态自动改为 **维保(3)**

---

### 4.7 完成维修

```
POST /repair-orders/{repairId}/complete
```

> 设备状态自动恢复为 **运行(1)**

---

## 五、维修工单状态流转

```
报修(POST) → 待修(0) → 开始维修(/start) → 维修中(1) → 完成维修(/complete) → 已完成(2)
```

**设备状态联动：**

| 维修动作 | 设备状态变化 |
|----------|-------------|
| 报修（新增） | → 故障(2) |
| 开始维修 | → 维保(3) |
| 完成维修 | → 运行(1) |
| 删除报修单 | → 运行(1) |

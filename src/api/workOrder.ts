import type { ApiResponse } from './request'
import request from './request'

// -------- 类型定义 --------

/** 投料消耗记录 */
export interface Consumption {
  consId: number
  lotNo: string
  mId: number
  mName: string
  consumeQty: number
  uom: string
  feedTime: string
  sourceType: number
  sourceTypeLabel: string
}

/** 批次信息 */
export interface Batch {
  batchId: string
  batchNo: string
  operatorId?: number
  operatorName?: string
  targetQty: number
  actualQty: number
  badQty: number
  goodQty: number
  batchStatus: number
  batchStatusLabel: string
  startTime: string
  endTime?: string
  consumptionList: Consumption[]
}

/** 工单列表项 */
export interface WorkOrder {
  woId: string
  woNo: string
  pId: number
  productName: string
  customerId?: number
  customerName?: string
  recipeId: number
  recipeName: string
  targetQty: number
  completedQty: number
  status: number
  statusLabel: string
  plannedStart?: string
  plannedEnd?: string
  createTime: string
  batchCount: number
}

/** 工单详情（含批次列表） */
export interface WorkOrderDetail extends WorkOrder {
  batchList: Batch[]
}

/** 新增/修改工单表单 */
export interface WorkOrderForm {
  woId?: string
  pId: number
  customerId?: number
  recipeId: number
  targetQty: number
  plannedStart?: string
  plannedEnd?: string
}

/** 分页响应 */
export interface PageResult<T> {
  total: number
  records: T[]
}

// -------- 接口方法 --------

/** 分页查询工单列表 */
export function getWorkOrderList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  pId?: number
  status?: number
}) {
  return request.get<ApiResponse<PageResult<WorkOrder>>>('/work-orders', { params })
}

/** 工单详情 */
export function getWorkOrderDetail(woId: string | number) {
  return request.get<ApiResponse<WorkOrderDetail>>(`/work-orders/${woId}`)
}

/** 新增工单 */
export function addWorkOrder(data: WorkOrderForm) {
  return request.post<ApiResponse>('/work-orders', data)
}

/** 修改工单 */
export function updateWorkOrder(data: WorkOrderForm) {
  return request.put<ApiResponse>('/work-orders', data)
}

/** 删除工单 */
export function deleteWorkOrder(woId: string | number) {
  return request.delete<ApiResponse>(`/work-orders/${woId}`)
}

/** 关闭工单 */
export function closeWorkOrder(woId: string | number) {
  return request.post<ApiResponse>(`/work-orders/${woId}/close`)
}

/** 启动新批次 */
export function startBatch(
  woId: string | number,
  params: { batchTargetQty: number; operatorId?: number },
) {
  return request.post<ApiResponse<string>>(`/work-orders/${woId}/start-batch`, null, { params })
}

/** 批次报工 */
export function reportBatch(
  batchId: string | number,
  params: { actualQty: number; badQty?: number },
) {
  return request.post<ApiResponse>(`/work-orders/batches/${batchId}/report`, null, { params })
}

/** 完成批次 */
export function completeBatch(batchId: string | number) {
  return request.post<ApiResponse>(`/work-orders/batches/${batchId}/complete`)
}

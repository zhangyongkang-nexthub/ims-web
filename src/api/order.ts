import type { ApiResponse } from './request'
import request from './request'

// 工单信息
export interface WorkOrder {
  woId: number
  woCode: string
  batchNo?: string
  pId: number
  productCode?: string
  productName: string
  recipeId: number
  recipeCode?: string
  recipeName: string
  recipeBaseQty?: number
  targetQty: number
  actualQty: number
  badQty: number
  goodRate?: number
  status: number
  statusLabel: string
  operatorId?: number
  operatorName?: string
  createTime: string
  startTime?: string
  endTime?: string
  updateTime?: string
  consumptionList?: Consumption[]
}

// 工单表单
export interface WorkOrderForm {
  woId?: number
  woCode?: string
  pId: number
  recipeId: number
  targetQty: number
  operatorId?: number
}

// 工单报工
export interface WorkOrderReport {
  actualQty: number
  badQty?: number
}

// 消耗信息
export interface Consumption {
  consId: number
  lotNo: string
  mId: number
  mCode?: string
  mName: string
  consumeQty: number
  uom: string
  feedTime: string
  sourceType: number
  sourceTypeLabel: string
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

/**
 * 分页查询工单列表
 */
export function getOrderList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  pId?: number
  status?: number
}) {
  return request.get<ApiResponse<PageResult<WorkOrder>>>('/orders', { params })
}

/**
 * 获取工单详情
 */
export function getOrderDetail(woId: number) {
  return request.get<ApiResponse<WorkOrder>>(`/orders/${woId}`)
}

/**
 * 新增工单
 */
export function addOrder(data: WorkOrderForm) {
  return request.post<ApiResponse>('/orders', data)
}

/**
 * 修改工单
 */
export function updateOrder(woId: number, data: Partial<WorkOrderForm>) {
  return request.put<ApiResponse>(`/orders/${woId}`, data)
}

/**
 * 删除工单
 */
export function deleteOrder(woId: number) {
  return request.delete<ApiResponse>(`/orders/${woId}`)
}

/**
 * 开始生产
 */
export function startProduction(woId: number) {
  return request.post<ApiResponse<string>>(`/orders/${woId}/start`)
}

/**
 * 生产报工
 */
export function reportProduction(woId: number, data: WorkOrderReport) {
  return request.post<ApiResponse>(`/orders/${woId}/report`, data)
}

/**
 * 完成生产
 */
export function completeProduction(woId: number) {
  return request.post<ApiResponse>(`/orders/${woId}/complete`)
}

/**
 * 结案归档
 */
export function closeOrder(woId: number) {
  return request.post<ApiResponse>(`/orders/${woId}/close`)
}

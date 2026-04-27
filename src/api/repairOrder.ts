import type { ApiResponse } from './request'
import request from './request'

export interface RepairOrder {
  repairId: string
  equipId: string
  equipName?: string
  equipCode?: string
  orderNo?: string
  faultDesc?: string
  sourceType?: number
  sourceTypeLabel?: string
  priority?: number
  priorityLabel?: string
  repairUser?: string
  status: number
  statusLabel?: string
  startTime?: string
  endTime?: string
  createTime?: string
}

export interface RepairOrderForm {
  equipId: string
  faultDesc?: string
  sourceType?: number
  priority?: number
  repairUser?: string
}

export interface PageResult<T> {
  total: number
  records: T[]
}

export function getRepairOrderList(params: {
  pageNum?: number
  pageSize?: number
  equipId?: string
  status?: number
  searchKey?: string
}) {
  return request.get<ApiResponse<PageResult<RepairOrder>>>('/repair-orders', { params })
}

export function getRepairOrderDetail(repairId: string | number) {
  return request.get<ApiResponse<RepairOrder>>(`/repair-orders/${repairId}`)
}

export function addRepairOrder(data: RepairOrderForm) {
  return request.post<ApiResponse>('/repair-orders', data)
}

export function updateRepairOrder(repairId: string | number, data: Partial<RepairOrderForm>) {
  return request.put<ApiResponse>(`/repair-orders/${repairId}`, data)
}

export function deleteRepairOrder(repairId: string | number) {
  return request.delete<ApiResponse>(`/repair-orders/${repairId}`)
}

export function startRepairOrder(repairId: string | number) {
  return request.post<ApiResponse>(`/repair-orders/${repairId}/start`)
}

export function completeRepairOrder(repairId: string | number) {
  return request.post<ApiResponse>(`/repair-orders/${repairId}/complete`)
}

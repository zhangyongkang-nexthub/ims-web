import type { ApiResponse } from './request'
import request from './request'

export interface Warehouse {
  whId: string
  whCode: string
  whName: string
  whType?: number
  createTime?: string
  updateTime?: string
}

export interface WarehouseForm {
  whId?: string
  whName: string
  whType?: number
}

export interface PageResult<T> {
  total: number
  records: T[]
}

/**
 * 分页查询仓库列表
 */
export function getWarehouseList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  whType?: number
}) {
  return request.get<ApiResponse<PageResult<Warehouse>>>('/warehouses', { params })
}

/**
 * 查询所有仓库（下拉）
 */
export function getWarehouseAll() {
  return request.get<ApiResponse<Warehouse[]>>('/warehouses/all')
}

/**
 * 获取仓库详情
 */
export function getWarehouseDetail(whId: string) {
  return request.get<ApiResponse<Warehouse>>(`/warehouses/${whId}`)
}

/**
 * 新增仓库
 */
export function addWarehouse(data: WarehouseForm) {
  return request.post<ApiResponse>('/warehouses', data)
}

/**
 * 修改仓库
 */
export function updateWarehouse(whId: string, data: Partial<WarehouseForm>) {
  return request.put<ApiResponse>(`/warehouses/${whId}`, data)
}

/**
 * 删除仓库
 */
export function deleteWarehouse(whId: string) {
  return request.delete<ApiResponse>(`/warehouses/${whId}`)
}

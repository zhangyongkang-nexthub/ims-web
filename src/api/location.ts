import type { ApiResponse } from './request'
import request from './request'

export interface Location {
  locId: string
  whId: string
  whCode?: string
  whName?: string
  locCode: string
  locType?: number
  maxCapacity?: number
  currentLoad?: number
  isActive: number
  status: number
  createTime?: string
  updateTime?: string
}

export interface LocationForm {
  locId?: string
  whId?: string
  locCode: string
  locType?: number
  maxCapacity?: number
  currentLoad?: number
  isActive: number
  status: number
}

export interface PageResult<T> {
  total: number
  records: T[]
}

/**
 * 分页查询库位列表
 */
export function getLocationList(params: {
  pageNum?: number
  pageSize?: number
  whId?: string
  searchKey?: string
  locType?: number
  isActive?: number
  status?: number
}) {
  return request.get<ApiResponse<PageResult<Location>>>('/locations', { params })
}

/**
 * 获取库位详情
 */
export function getLocationDetail(locId: string) {
  return request.get<ApiResponse<Location>>(`/locations/${locId}`)
}

/**
 * 新增库位
 */
export function addLocation(data: LocationForm) {
  return request.post<ApiResponse>('/locations', data)
}

/**
 * 修改库位
 */
export function updateLocation(locId: string, data: Partial<LocationForm>) {
  return request.put<ApiResponse>(`/locations/${locId}`, data)
}

/**
 * 删除库位
 */
export function deleteLocation(locId: string) {
  return request.delete<ApiResponse>(`/locations/${locId}`)
}

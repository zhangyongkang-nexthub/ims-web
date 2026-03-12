import type { ApiResponse } from './request'
import request from './request'

// 工位信息
export interface Station {
  stationId: number
  stationCode: string
  stationName: string
  processType: string
  sortOrder: number
  status: number
  createTime?: string
  updateTime?: string
}

// 工位表单
export interface StationForm {
  stationId?: number
  stationCode?: string
  stationName: string
  processType: string
  sortOrder: number
  status: number
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

/**
 * 分页查询工位列表
 */
export function getStationList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  searchStatus?: number
}) {
  return request.get<ApiResponse<PageResult<Station>>>('/stations', { params })
}

/**
 * 获取工位详情
 */
export function getStationDetail(stationId: number) {
  return request.get<ApiResponse<Station>>(`/stations/${stationId}`)
}

/**
 * 新增工位
 */
export function addStation(data: StationForm) {
  return request.post<ApiResponse>('/stations', data)
}

/**
 * 修改工位
 */
export function updateStation(stationId: number, data: Partial<StationForm>) {
  return request.put<ApiResponse>(`/stations/${stationId}`, data)
}

/**
 * 删除工位
 */
export function deleteStation(stationId: number) {
  return request.delete<ApiResponse>(`/stations/${stationId}`)
}

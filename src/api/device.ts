import type { ApiResponse } from './request'
import request from './request'

// 设备信息
export interface Device {
  deviceId: number
  stationId: number
  stationName?: string
  deviceCode: string
  deviceType: string
  deviceModel?: string
  status: number
  createTime?: string
  updateTime?: string
}

// 设备表单
export interface DeviceForm {
  deviceId?: number
  stationId: number
  deviceCode?: string
  deviceType: string
  deviceModel?: string
  status: number
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

/**
 * 分页查询设备列表
 */
export function getDeviceList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  stationId?: number
}) {
  return request.get<ApiResponse<PageResult<Device>>>('/devices', { params })
}

/**
 * 获取设备详情
 */
export function getDeviceDetail(deviceId: number) {
  return request.get<ApiResponse<Device>>(`/devices/${deviceId}`)
}

/**
 * 新增设备
 */
export function addDevice(data: DeviceForm) {
  return request.post<ApiResponse>('/devices', data)
}

/**
 * 修改设备
 */
export function updateDevice(deviceId: number, data: Partial<DeviceForm>) {
  return request.put<ApiResponse>(`/devices/${deviceId}`, data)
}

/**
 * 删除设备
 */
export function deleteDevice(deviceId: number) {
  return request.delete<ApiResponse>(`/devices/${deviceId}`)
}

import type { ApiResponse } from './request'
import request from './request'

// 传感器信息
export interface Device {
  deviceId: string
  stationId: number
  stationName?: string
  equipId?: string
  equipName?: string
  deviceCode: string
  deviceName?: string
  deviceType: string
  sensorCategory?: 'PROCESS' | 'PER_BOTTLE' | null
  sensorCategoryLabel?: string
  kafkaTopic?: string
  redisKey?: string
  status: number
  statusLabel?: string
  createTime?: string
  updateTime?: string
}

// 传感器表单
export interface DeviceForm {
  deviceId?: string
  stationId: number
  equipId?: string
  deviceCode?: string
  deviceName?: string
  deviceType: string
  sensorCategory?: 'PROCESS' | 'PER_BOTTLE' | null
  kafkaTopic?: string
  redisKey?: string
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
  deviceName?: string
  stationId?: number
}) {
  return request.get<ApiResponse<PageResult<Device>>>('/devices', { params })
}

/**
 * 获取设备详情
 */
export function getDeviceDetail(deviceId: string | number) {
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
export function updateDevice(deviceId: string | number, data: Partial<DeviceForm>) {
  return request.put<ApiResponse>(`/devices/${deviceId}`, data)
}

/**
 * 删除设备
 */
export function deleteDevice(deviceId: string | number) {
  return request.delete<ApiResponse>(`/devices/${deviceId}`)
}

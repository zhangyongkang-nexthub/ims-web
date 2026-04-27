import type { Device } from './device'
import type { ApiResponse } from './request'
import request from './request'

export interface Equipment {
  equipId: string
  equipCode: string
  equipName: string
  model?: string
  stationId: number
  stationName?: string
  status: number
  statusLabel?: string
  installDate?: string
  expiryDate?: string
  createTime?: string
  sensorCount?: number
}

export interface EquipmentForm {
  equipCode: string
  equipName: string
  model?: string
  stationId: number
  status: number
  installDate?: string
  expiryDate?: string
}

export interface EquipmentDetail {
  equipment: Equipment
  sensors: Device[]
}

export interface PageResult<T> {
  total: number
  records: T[]
}

export function getEquipmentList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  stationId?: number
  status?: number
}) {
  return request.get<ApiResponse<PageResult<Equipment>>>('/equipments', { params })
}

export function getEquipmentDetail(equipId: string | number) {
  return request.get<ApiResponse<EquipmentDetail>>(`/equipments/${equipId}`)
}

export function addEquipment(data: EquipmentForm) {
  return request.post<ApiResponse>('/equipments', data)
}

export function updateEquipment(equipId: string | number, data: Partial<EquipmentForm>) {
  return request.put<ApiResponse>(`/equipments/${equipId}`, data)
}

export function deleteEquipment(equipId: string | number) {
  return request.delete<ApiResponse>(`/equipments/${equipId}`)
}

export function updateEquipmentStatus(equipId: string | number, status: number) {
  return request.put<ApiResponse>(`/equipments/${equipId}/status`, null, { params: { status } })
}

import type { ApiResponse } from './request'
import request from './request'

// ======================== 字典类型 ========================

export interface DictType {
  id: number
  dictName: string
  dictType: string
  remark: string | null
}

export interface DictTypeForm {
  id?: number
  dictName: string
  dictType: string
  remark?: string
}

/**
 * 查询全部字典类型
 */
export function getDictTypeList() {
  return request.get<ApiResponse<DictType[]>>('/dict-types')
}

/**
 * 获取字典类型详情
 */
export function getDictTypeDetail(id: number) {
  return request.get<ApiResponse<DictType>>(`/dict-types/${id}`)
}

/**
 * 新增字典类型
 */
export function addDictType(data: DictTypeForm) {
  return request.post<ApiResponse>('/dict-types', data)
}

/**
 * 修改字典类型
 */
export function updateDictType(id: number, data: Partial<DictTypeForm>) {
  return request.put<ApiResponse>(`/dict-types/${id}`, data)
}

/**
 * 删除字典类型
 */
export function deleteDictType(id: number) {
  return request.delete<ApiResponse>(`/dict-types/${id}`)
}

// ======================== 字典数据 ========================

export interface DictData {
  id: number
  dictType: string
  dictLabel: string
  dictValue: string
  dictSort: number
  isDefault: boolean
  status: boolean
  remark: string | null
}

export interface DictDataForm {
  id?: number
  dictType: string
  dictLabel: string
  dictValue: string
  dictSort: number
  isDefault: boolean
  status: boolean
  remark?: string
}

/**
 * 按字典类型编码查询数据列表（仅启用项，按排序号升序）
 */
export function getDictDataList(dictType: string) {
  return request.get<ApiResponse<DictData[]>>('/dict-data', { params: { dictType } })
}

/**
 * 获取字典数据详情
 */
export function getDictDataDetail(id: number) {
  return request.get<ApiResponse<DictData>>(`/dict-data/${id}`)
}

/**
 * 新增字典数据
 */
export function addDictData(data: DictDataForm) {
  return request.post<ApiResponse>('/dict-data', data)
}

/**
 * 修改字典数据
 */
export function updateDictData(id: number, data: Partial<DictDataForm>) {
  return request.put<ApiResponse>(`/dict-data/${id}`, data)
}

/**
 * 删除字典数据
 */
export function deleteDictData(id: number) {
  return request.delete<ApiResponse>(`/dict-data/${id}`)
}

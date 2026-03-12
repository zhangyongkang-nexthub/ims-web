import type { ApiResponse } from './request'
import request from './request'

// 工艺方案信息
export interface Craft {
  id: number
  productId: number
  productName: string
  recipeName: string
  isDefault: boolean
  isDefaultLabel: string
  remark: string | null
  createTime: string
  updateTime: string
}

// 工艺方案表单
export interface CraftForm {
  id?: number
  productId: number
  recipeName: string
  isDefault: boolean
  remark?: string
}

// 工艺参数明细信息
export interface CraftDetail {
  id: number
  recipeId: number
  processType: string
  parameterName: string
  targetValue: number
  maxThreshold: number
  minThreshold: number
  unit: string
}

// 工艺参数明细表单
export interface CraftDetailForm {
  id?: number
  recipeId: number
  processType: string
  parameterName: string
  targetValue: number
  maxThreshold: number
  minThreshold: number
  unit: string
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

// ======================== 工艺方案接口 ========================

/**
 * 分页查询工艺方案列表
 */
export function getCraftList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  productId?: number
  isDefault?: boolean
}) {
  return request.get<ApiResponse<PageResult<Craft>>>('/crafts', { params })
}

/**
 * 获取工艺方案详情
 */
export function getCraftDetail(id: number) {
  return request.get<ApiResponse<Craft>>(`/crafts/${id}`)
}

/**
 * 新增工艺方案
 */
export function addCraft(data: CraftForm) {
  return request.post<ApiResponse>('/crafts', data)
}

/**
 * 修改工艺方案
 */
export function updateCraft(id: number, data: Partial<CraftForm>) {
  return request.put<ApiResponse>(`/crafts/${id}`, data)
}

/**
 * 删除工艺方案
 */
export function deleteCraft(id: number) {
  return request.delete<ApiResponse>(`/crafts/${id}`)
}

// ======================== 工艺参数明细接口 ========================

/**
 * 分页查询工艺参数明细列表
 */
export function getCraftDetailList(params: {
  pageNum?: number
  pageSize?: number
  recipeId?: number
  processType?: string
}) {
  return request.get<ApiResponse<PageResult<CraftDetail>>>('/craft-details', { params })
}

/**
 * 获取工艺参数明细详情
 */
export function getCraftDetailInfo(id: number) {
  return request.get<ApiResponse<CraftDetail>>(`/craft-details/${id}`)
}

/**
 * 新增工艺参数明细
 */
export function addCraftDetail(data: CraftDetailForm) {
  return request.post<ApiResponse>('/craft-details', data)
}

/**
 * 修改工艺参数明细
 */
export function updateCraftDetail(id: number, data: Partial<CraftDetailForm>) {
  return request.put<ApiResponse>(`/craft-details/${id}`, data)
}

/**
 * 删除工艺参数明细
 */
export function deleteCraftDetail(id: number) {
  return request.delete<ApiResponse>(`/craft-details/${id}`)
}

import type { ApiResponse } from './request'
import request from './request'

// 供应商信息
export interface Supplier {
  supId: number
  supCode: string
  supName: string
  supType: string
  contactPerson?: string
  contactPhone?: string
  status: number
  createTime: string
  updateTime?: string
}

// 供应商表单
export interface SupplierForm {
  supId?: number
  supCode?: string
  supName: string
  supType: string
  contactPerson?: string
  contactPhone?: string
  status: number
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

/**
 * 分页查询供应商列表
 */
export function getSupplierList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  searchStatus?: number
}) {
  return request.get<ApiResponse<PageResult<Supplier>>>('/suppliers', { params })
}

/**
 * 获取供应商详情
 */
export function getSupplierDetail(supId: number) {
  return request.get<ApiResponse<Supplier>>(`/suppliers/${supId}`)
}

/**
 * 新增供应商
 */
export function addSupplier(data: SupplierForm) {
  return request.post<ApiResponse>('/suppliers', data)
}

/**
 * 修改供应商
 */
export function updateSupplier(supId: number, data: Partial<SupplierForm>) {
  return request.put<ApiResponse>(`/suppliers/${supId}`, data)
}

/**
 * 删除供应商
 */
export function deleteSupplier(supId: number) {
  return request.delete<ApiResponse>(`/suppliers/${supId}`)
}

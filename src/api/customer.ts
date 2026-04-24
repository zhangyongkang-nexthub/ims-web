import type { ApiResponse } from './request'
import request from './request'

// 客户信息
export interface Customer {
  custId: number
  custCode: string
  custName: string
  custType?: number
  custTypeLabel?: string
  contactPerson?: string
  contactPhone?: string
  address?: string
  status: number
  createTime: string
  updateTime?: string
}

// 客户表单
export interface CustomerForm {
  custId?: number
  custCode?: string
  custName: string
  custType?: number
  contactPerson?: string
  contactPhone?: string
  address?: string
  status: number
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

/**
 * 分页查询客户列表
 */
export function getCustomerList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  searchStatus?: number
}) {
  return request.get<ApiResponse<PageResult<Customer>>>('/customers', { params })
}

/**
 * 获取客户详情
 */
export function getCustomerDetail(custId: number) {
  return request.get<ApiResponse<Customer>>(`/customers/${custId}`)
}

/**
 * 新增客户
 */
export function addCustomer(data: CustomerForm) {
  return request.post<ApiResponse>('/customers', data)
}

/**
 * 修改客户
 */
export function updateCustomer(custId: number, data: Partial<CustomerForm>) {
  return request.put<ApiResponse>(`/customers/${custId}`, data)
}

/**
 * 删除客户
 */
export function deleteCustomer(custId: number) {
  return request.delete<ApiResponse>(`/customers/${custId}`)
}

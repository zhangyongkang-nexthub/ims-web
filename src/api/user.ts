import type { ApiResponse } from './request'
import request from './request'

// 用户信息
export interface User {
  id: number
  username: string
  nickname: string
  employeeNo: string
  status: boolean
  createTime: string
  updateTime: string
  roles?: Role[]
  permissions?: string[]
}

// 角色信息
export interface Role {
  roleId: number
  roleName: string
  roleKey: string
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

// 用户表单
export interface UserForm {
  id?: number
  username: string
  password?: string
  nickname: string
  employeeNo: string
  status: boolean
  roleIds: number[]
}

/**
 * 分页查询用户列表
 */
export function getUserList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  searchStatus?: boolean
}) {
  return request<ApiResponse<PageResult<User>>>({
    url: '/users',
    method: 'get',
    params,
  })
}

/**
 * 获取用户详情
 */
export function getUserDetail(userId: number) {
  return request<ApiResponse<User>>({
    url: `/users/${userId}`,
    method: 'get',
  })
}

/**
 * 新增用户
 */
export function addUser(data: UserForm) {
  return request<ApiResponse<null>>({
    url: '/users',
    method: 'post',
    data,
  })
}

/**
 * 修改用户
 */
export function updateUser(userId: number, data: UserForm) {
  return request<ApiResponse<null>>({
    url: `/users/${userId}`,
    method: 'put',
    data,
  })
}

/**
 * 删除用户
 */
export function deleteUser(userId: number) {
  return request<ApiResponse<null>>({
    url: `/users/${userId}`,
    method: 'delete',
  })
}

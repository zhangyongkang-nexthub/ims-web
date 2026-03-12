import type { ApiResponse } from './request'
import request from './request'

// 角色信息
export interface Role {
  id: number
  roleName: string
  roleKey: string
}

// 角色详情（包含权限）
export interface RoleDetail {
  roleId: number
  roleName: string
  roleKey: string
  menuIds: number[]
  permissions: string[]
}

// 角色表单
export interface RoleForm {
  id?: number
  roleName: string
  roleKey: string
}

// 分配权限参数
export interface AssignPermsParams {
  roleId: number
  menuIds: number[]
}

/**
 * 查询所有角色
 */
export function getRoleList() {
  return request<ApiResponse<Role[]>>({
    url: '/roles',
    method: 'get',
  })
}

/**
 * 获取角色详情（包含权限）
 */
export function getRoleDetail(roleId: number) {
  return request<ApiResponse<RoleDetail>>({
    url: `/roles/${roleId}`,
    method: 'get',
  })
}

/**
 * 新增角色
 */
export function addRole(data: RoleForm) {
  return request<ApiResponse<null>>({
    url: '/roles',
    method: 'post',
    data,
  })
}

/**
 * 修改角色
 */
export function updateRole(roleId: number, data: RoleForm) {
  return request<ApiResponse<null>>({
    url: `/roles/${roleId}`,
    method: 'put',
    data,
  })
}

/**
 * 删除角色
 */
export function deleteRole(roleId: number) {
  return request<ApiResponse<null>>({
    url: `/roles/${roleId}`,
    method: 'delete',
  })
}

/**
 * 为角色分配权限
 */
export function assignPerms(data: AssignPermsParams) {
  return request<ApiResponse<null>>({
    url: '/roles/assignPerms',
    method: 'post',
    data,
  })
}

/**
 * 获取角色的权限列表
 */
export function getRolePermissions(roleId: number) {
  return request<ApiResponse<string[]>>({
    url: `/roles/${roleId}/permissions`,
    method: 'get',
  })
}

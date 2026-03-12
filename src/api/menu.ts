import type { ApiResponse } from './request'
import request from './request'

// 菜单类型
export type MenuType = 'M' | 'C' | 'F'

// 菜单信息
export interface Menu {
  id: number
  parentId: number
  menuName: string
  path: string
  component: string | null
  perms: string | null
  menuType: MenuType
  children?: Menu[]
}

// 菜单表单
export interface MenuForm {
  id?: number
  parentId: number
  menuName: string
  path: string
  component: string
  perms: string
  menuType: MenuType
}

/**
 * 查询所有菜单（平面列表）
 */
export function getMenuList() {
  return request<ApiResponse<Menu[]>>({
    url: '/menus',
    method: 'get',
  })
}

/**
 * 获取菜单树结构
 */
export function getMenuTree() {
  return request<ApiResponse<Menu[]>>({
    url: '/menus/tree',
    method: 'get',
  })
}

/**
 * 获取权限标识符列表
 */
export function getPermissions() {
  return request<ApiResponse<string[]>>({
    url: '/menus/permissions',
    method: 'get',
  })
}

/**
 * 新增菜单
 */
export function addMenu(data: MenuForm) {
  return request<ApiResponse<null>>({
    url: '/menus',
    method: 'post',
    data,
  })
}

/**
 * 修改菜单
 */
export function updateMenu(menuId: number, data: MenuForm) {
  return request<ApiResponse<null>>({
    url: `/menus/${menuId}`,
    method: 'put',
    data,
  })
}

/**
 * 删除菜单
 */
export function deleteMenu(menuId: number) {
  return request<ApiResponse<null>>({
    url: `/menus/${menuId}`,
    method: 'delete',
  })
}

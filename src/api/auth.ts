import type { ApiResponse } from './request'
import request from './request'

// 登录请求参数
export interface LoginParams {
  username: string
  password: string
}

/**
 * 用户登录
 */
export function login(data: LoginParams) {
  return request<ApiResponse<string>>({
    url: '/auth/login',
    method: 'post',
    data,
  })
}

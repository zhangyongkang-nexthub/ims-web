import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// API响应数据结构
export interface ApiResponse<T = any> {
  code: number
  msg: string | null
  data: T
}

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: any) => {
    const res = response.data

    // code为1表示成功
    if (res.code === 1) {
      return res
    } else {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
  },
  (error) => {
    console.error('响应错误:', error)

    // 401未授权，跳转登录
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('token')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  },
)

interface RequestInstance {
  <T = any>(config: AxiosRequestConfig): Promise<T>
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
}

const request = (<T = any>(config: AxiosRequestConfig) =>
  service.request<any, T>(config)) as RequestInstance

request.get = <T = any>(url: string, config?: AxiosRequestConfig) =>
  service.get<any, T>(url, config)
request.post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  service.post<any, T>(url, data, config)
request.put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  service.put<any, T>(url, data, config)
request.delete = <T = any>(url: string, config?: AxiosRequestConfig) =>
  service.delete<any, T>(url, config)

export default request

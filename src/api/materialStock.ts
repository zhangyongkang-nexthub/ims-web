import type { ApiResponse } from './request'
import request from './request'

export interface MaterialStock {
  id: number
  materialId: number
  materialName: string
  totalQuantity: number
  minThreshold: number | null
  unit: string
  lastPurchaseDate: string
  createTime: string
  updateTime: string
}

/**
 * 查询库存（可按物料ID过滤）
 */
export function getMaterialStockList(params?: { mId?: number }) {
  return request.get<ApiResponse<MaterialStock[]>>('/material-stocks', { params })
}

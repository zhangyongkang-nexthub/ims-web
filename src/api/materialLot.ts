import type { ApiResponse } from './request'
import request from './request'

// 库存批次明细
export interface MaterialLot {
  lotStockId: string
  itemId: number
  itemType: number
  itemName?: string
  batchNo?: string
  whId: string
  whName?: string
  locId: string
  locCode?: string
  currentQty: number
  unit?: string
  productionDate?: string
  expiryDate?: string
  qcStatus?: number
  qcStatusLabel?: string
  updateTime?: string
}

// 材料/产成品入库表单
export interface MaterialLotForm {
  itemId: number
  itemType: number
  batchNo?: string
  whId: string
  locId: string
  quantity: number
  unit?: string
  productionDate?: string
  expiryDate?: string
  qcStatus?: number
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

export interface MaterialStockSummary {
  itemId: string
  itemType: number
  itemName?: string
  whId: string
  whName?: string
  totalQty: number
  unit?: string
}

export interface MaterialLotTransferForm {
  lotStockId: string
  targetWhId: string
  targetLocId: string
  transferQty: number
}

function normalizeMaterialLot(raw: any): MaterialLot {
  return {
    lotStockId: String(raw?.lotStockId ?? ''),
    itemId: Number(raw?.itemId ?? 0),
    itemType: Number(raw?.itemType ?? 1),
    itemName: raw?.itemName,
    batchNo: raw?.batchNo,
    whId: String(raw?.whId ?? ''),
    whName: raw?.whName,
    locId: String(raw?.locId ?? ''),
    locCode: raw?.locCode,
    currentQty: Number(raw?.currentQty ?? 0),
    unit: raw?.unit,
    productionDate: raw?.productionDate,
    expiryDate: raw?.expiryDate,
    qcStatus: raw?.qcStatus,
    qcStatusLabel: raw?.qcStatusLabel,
    updateTime: raw?.updateTime,
  }
}

function normalizeMaterialStockSummary(raw: any): MaterialStockSummary {
  return {
    itemId: String(raw?.itemId ?? ''),
    itemType: Number(raw?.itemType ?? 1),
    itemName: raw?.itemName,
    whId: String(raw?.whId ?? ''),
    whName: raw?.whName,
    totalQty: Number(raw?.totalQty ?? 0),
    unit: raw?.unit,
  }
}

/**
 * 分页查询库存批次库位明细
 */
export function getMaterialLotList(params: {
  pageNum?: number
  pageSize?: number
  itemId?: string | number
  itemType?: number
  whId?: string
  locId?: string
}) {
  return request
    .get<ApiResponse<PageResult<any>>>('/stock-lots/detail', { params })
    .then((res) => ({
      ...res,
      data: {
        ...res.data,
        records: (res.data.records || []).map(normalizeMaterialLot),
      },
    }))
}

/**
 * 新增材料/产成品入库
 */
export function addMaterialLot(data: MaterialLotForm) {
  return request.post<ApiResponse>('/stock-lots/in', data)
}

/**
 * 库存批次移库
 */
export function transferMaterialLot(data: MaterialLotTransferForm) {
  return request.post<ApiResponse>('/stock-lots/transfer', data)
}

/**
 * 查询库存汇总（按物料+仓库）
 */
export function getMaterialStockSummary(params: {
  itemId?: string | number
  itemType?: number
  whId?: string
}) {
  const query: { itemId?: string; itemType?: number; whId?: string } = {}
  if (params.itemId !== undefined && params.itemId !== null) {
    query.itemId = String(params.itemId)
  }
  if (params.itemType !== undefined && params.itemType !== null) {
    query.itemType = params.itemType
  }
  if (params.whId) {
    query.whId = params.whId
  }

  return request.get<ApiResponse<any[]>>('/stock-lots/summary', { params: query }).then((res) => ({
    ...res,
    data: (res.data || []).map(normalizeMaterialStockSummary),
  }))
}

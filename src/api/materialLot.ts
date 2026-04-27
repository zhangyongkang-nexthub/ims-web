import type { ApiResponse } from './request'
import request from './request'

// 库存批次明细
export interface MaterialLot {
  lotStockId: string
  itemId: number
  itemType: number
  itemCode?: string
  itemName?: string
  batchNo?: string
  supId?: string
  supName?: string
  whId: string
  whName?: string
  locId: string
  locCode?: string
  currentQty: number
  unit?: string
  productionDate?: string
  produceDate?: string
  expiryDate?: string
  receiptStatus?: number
  receiptStatusLabel?: string
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

export interface MaterialLotRegisterForm {
  itemId: number
  itemType: number
  supId?: number
  supplierId?: number
  totalQuantity: number
  unit?: string
  productionDate?: string
  expiryDate?: string
}

export interface MaterialLotRegisterInfo {
  batchNo: string
  itemId: number
  itemType: number
  itemName?: string
  totalQuantity: number
  putAwayQuantity: number
  pendingQuantity: number
  unit?: string
  productionDate?: string
  expiryDate?: string
  status?: number
  statusLabel?: string
  createTime?: string
}

export interface MaterialLotPutAwayForm {
  batchNo: string
  whId: string
  locId: string
  quantity: number
}

function normalizeMaterialLot(raw: any): MaterialLot {
  const productionDate = raw?.productionDate ?? raw?.produceDate
  return {
    lotStockId: String(raw?.lotStockId ?? ''),
    itemId: Number(raw?.itemId ?? 0),
    itemType: Number(raw?.itemType ?? 1),
    itemCode: raw?.itemCode,
    itemName: raw?.itemName,
    batchNo: raw?.batchNo,
    supId: raw?.supId !== undefined && raw?.supId !== null ? String(raw.supId) : undefined,
    supName: raw?.supName,
    whId: String(raw?.whId ?? ''),
    whName: raw?.whName,
    locId: String(raw?.locId ?? ''),
    locCode: raw?.locCode,
    currentQty: Number(raw?.currentQty ?? 0),
    unit: raw?.unit,
    productionDate,
    produceDate: raw?.produceDate,
    expiryDate: raw?.expiryDate,
    receiptStatus: raw?.receiptStatus,
    receiptStatusLabel: raw?.receiptStatusLabel,
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

function normalizeMaterialLotRegisterInfo(raw: any): MaterialLotRegisterInfo {
  const productionDate = raw?.productionDate ?? raw?.produceDate
  return {
    batchNo: String(raw?.batchNo ?? ''),
    itemId: Number(raw?.itemId ?? 0),
    itemType: Number(raw?.itemType ?? 1),
    itemName: raw?.itemName,
    totalQuantity: Number(raw?.totalQuantity ?? 0),
    putAwayQuantity: Number(raw?.putAwayQuantity ?? 0),
    pendingQuantity: Number(raw?.pendingQuantity ?? 0),
    unit: raw?.unit,
    productionDate,
    expiryDate: raw?.expiryDate,
    status: raw?.status,
    statusLabel: raw?.statusLabel,
    createTime: raw?.createTime,
  }
}

/**
 * 分页查询库存批次库位明细
 */
export function getMaterialLotList(params: {
  pageNum?: number
  pageSize?: number
  itemCode?: string
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
 * 两步入库：第一步登记
 */
export function registerMaterialLot(data: MaterialLotRegisterForm) {
  const payload = {
    ...data,
    ...(data.supId !== undefined ? { supplierId: data.supId } : {}),
    ...(data.supId !== undefined ? { supplier_id: data.supId } : {}),
    ...(data.supplierId !== undefined ? { supplier_id: data.supplierId } : {}),
    ...(data.productionDate ? { production_date: data.productionDate } : {}),
    ...(data.expiryDate ? { expiry_date: data.expiryDate } : {}),
  }

  return request.post<ApiResponse<any>>('/stock-lots/register', payload).then((res) => ({
    ...res,
    data: normalizeMaterialLotRegisterInfo(res.data),
  }))
}

/**
 * 两步入库：第二步上架入位
 */
export function putAwayMaterialLot(data: MaterialLotPutAwayForm) {
  return request.post<ApiResponse>('/stock-lots/put-away', data)
}

/**
 * 查询批次登记与上架进度
 */
export function getMaterialLotRegisterDetail(batchNo: string) {
  return request.get<ApiResponse<any>>(`/stock-lots/register/${batchNo}`).then((res) => ({
    ...res,
    data: normalizeMaterialLotRegisterInfo(res.data),
  }))
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
  itemCode?: string
  itemId?: string | number
  itemType?: number
  whId?: string
}) {
  const query: { itemCode?: string; itemId?: string; itemType?: number; whId?: string } = {}
  if (params.itemCode) {
    query.itemCode = params.itemCode
  }
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

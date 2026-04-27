import type { ApiResponse } from './request'
import request from './request'

export interface PageResult<T> {
  total: number
  records: T[]
  pages?: number
  pageNum?: number
  pageSize?: number
}

export interface ProductStock {
  stockId: string
  pId: number
  pCode?: string
  pName?: string
  quantity: number
  unit?: string
  lastStockInTime?: string | null
  lastStockOutTime?: string | null
  updateTime?: string
}

export interface ProductReceiveRecord {
  receiveId: string
  receiveNo?: string
  batchNo?: string
  pId: number
  pName?: string
  quantity: number
  uom?: string
  operatorId?: string
  createTime?: string
}

export interface ProductShipRecord {
  shipId: string
  shipNo?: string
  batchNo?: string
  customerName?: string
  quantity: number
  shipTime?: string
  operatorId?: string
}

export interface ProductReceiveForm {
  pId: number
  batchNo?: string
  whId?: string
  locId?: string
  quantity: number
  uom?: string
  operatorId?: string
}

export interface ProductShipForm {
  pId: number
  batchNo?: string
  quantity: number
  customerName?: string
  operatorId?: string
}

export interface ProductPending {
  receiveId: string
  receiveNo?: string
  batchNo?: string
  pId: number
  pCode?: string
  pName?: string
  quantity: number
  putAwayQty: number
  pendingQty: number
  uom?: string
  state?: number
  stateLabel?: string
  createTime?: string
}

export interface ProductPendingPutAwayForm {
  receiveId: string
  whId: string
  locId: string
  quantity: number
}

function normalizeProductStock(raw: any): ProductStock {
  return {
    stockId: String(raw?.stockId ?? ''),
    pId: Number(raw?.pId ?? raw?.pid ?? 0),
    pCode: raw?.pCode ?? raw?.pcode,
    pName: raw?.pName ?? raw?.pname,
    quantity: Number(raw?.quantity ?? 0),
    unit: raw?.unit,
    lastStockInTime: raw?.lastStockInTime ?? null,
    lastStockOutTime: raw?.lastStockOutTime ?? null,
    updateTime: raw?.updateTime,
  }
}

function normalizeReceiveRecord(raw: any): ProductReceiveRecord {
  return {
    receiveId: String(raw?.receiveId ?? ''),
    receiveNo: raw?.receiveNo,
    batchNo: raw?.batchNo,
    pId: Number(raw?.pId ?? 0),
    pName: raw?.pName,
    quantity: Number(raw?.quantity ?? 0),
    uom: raw?.uom,
    operatorId: raw?.operatorId !== undefined && raw?.operatorId !== null ? String(raw?.operatorId) : undefined,
    createTime: raw?.createTime,
  }
}

function normalizeShipRecord(raw: any): ProductShipRecord {
  return {
    shipId: String(raw?.shipId ?? ''),
    shipNo: raw?.shipNo,
    batchNo: raw?.batchNo,
    customerName: raw?.customerName,
    quantity: Number(raw?.quantity ?? 0),
    shipTime: raw?.shipTime,
    operatorId: raw?.operatorId !== undefined && raw?.operatorId !== null ? String(raw?.operatorId) : undefined,
  }
}

function normalizeProductPending(raw: any): ProductPending {
  return {
    receiveId: String(raw?.receiveId ?? raw?.receiveid ?? raw?.pendingId ?? ''),
    receiveNo: raw?.receiveNo ?? raw?.receiveno ?? raw?.pendingNo,
    batchNo: raw?.batchNo ?? raw?.batchno,
    pId: Number(raw?.pId ?? raw?.pid ?? 0),
    pCode: raw?.pCode ?? raw?.pcode,
    pName: raw?.pName ?? raw?.pname,
    quantity: Number(raw?.quantity ?? 0),
    putAwayQty: Number(raw?.putAwayQty ?? raw?.putawayqty ?? 0),
    pendingQty: Number(raw?.pendingQty ?? raw?.pendingqty ?? 0),
    uom: raw?.uom,
    state: raw?.state ?? raw?.status,
    stateLabel: raw?.stateLabel ?? raw?.statusLabel,
    createTime: raw?.createTime ?? raw?.createtime,
  }
}

export function getProductStockList(params: { pageNum?: number; pageSize?: number; pId?: number }) {
  return request.get<ApiResponse<PageResult<any>>>('/product-stock', { params }).then((res) => ({
    ...res,
    data: {
      ...res.data,
      records: (res.data.records || []).map(normalizeProductStock),
    },
  }))
}

export function getProductPendingList(params: {
  pageNum?: number
  pageSize?: number
  pId?: number
  state?: number
}) {
  return request.get<ApiResponse<PageResult<any>>>('/product-pending', { params }).then((res) => ({
    ...res,
    data: {
      ...res.data,
      records: (res.data.records || []).map(normalizeProductPending),
    },
  }))
}

export function getProductPendingDetail(receiveId: string) {
  return request.get<ApiResponse<any>>(`/product-pending/${receiveId}`).then((res) => ({
    ...res,
    data: normalizeProductPending(res.data),
  }))
}

export function putAwayProductPending(data: ProductPendingPutAwayForm) {
  return request.post<ApiResponse>('/product-pending/put-away', data)
}

export function receiveProductStock(data: ProductReceiveForm) {
  return request.post<ApiResponse>('/product-stock/receive', data)
}

export function shipProductStock(data: ProductShipForm) {
  return request.post<ApiResponse>('/product-stock/ship', data)
}

export function getProductReceiveRecordList(params: {
  pageNum?: number
  pageSize?: number
  pId?: number
  batchNo?: string
}) {
  return request.get<ApiResponse<PageResult<any>>>('/product-stock/receive-records', { params }).then((res) => ({
    ...res,
    data: {
      ...res.data,
      records: (res.data.records || []).map(normalizeReceiveRecord),
    },
  }))
}

export function getProductShipRecordList(params: {
  pageNum?: number
  pageSize?: number
  batchNo?: string
  customerName?: string
}) {
  return request.get<ApiResponse<PageResult<any>>>('/product-stock/ship-records', { params }).then((res) => ({
    ...res,
    data: {
      ...res.data,
      records: (res.data.records || []).map(normalizeShipRecord),
    },
  }))
}

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
  woId?: string
  woNo?: string
  pId?: number
  productName?: string
  batchNo?: string
  customerName?: string
  quantity: number
  shipTime?: string
  operatorId?: string
}

export interface ShippableOrder {
  woId: string
  woNo: string
  pId: number
  productName?: string
  customerId?: string
  customerName?: string
  targetQty?: number
  completedQty?: number
  alreadyShipped?: number
  shippableQty?: number
  currentStock?: number
  status?: number
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
  woId?: string
  pId?: number
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
    operatorId:
      raw?.operatorId !== undefined && raw?.operatorId !== null
        ? String(raw?.operatorId)
        : undefined,
    createTime: raw?.createTime,
  }
}

function normalizeShipRecord(raw: any): ProductShipRecord {
  return {
    shipId: String(raw?.shipId ?? ''),
    shipNo: raw?.shipNo,
    woId: raw?.woId !== undefined && raw?.woId !== null ? String(raw?.woId) : undefined,
    woNo: raw?.woNo,
    pId: raw?.pId !== undefined && raw?.pId !== null ? Number(raw?.pId) : undefined,
    productName: raw?.productName ?? raw?.pName,
    batchNo: raw?.batchNo,
    customerName: raw?.customerName,
    quantity: Number(raw?.quantity ?? 0),
    shipTime: raw?.shipTime,
    operatorId:
      raw?.operatorId !== undefined && raw?.operatorId !== null
        ? String(raw?.operatorId)
        : undefined,
  }
}

function normalizeShippableOrder(raw: any): ShippableOrder {
  return {
    woId: String(raw?.woId ?? ''),
    woNo: raw?.woNo ?? '',
    pId: Number(raw?.pId ?? 0),
    productName: raw?.productName,
    customerId:
      raw?.customerId !== undefined && raw?.customerId !== null
        ? String(raw?.customerId)
        : undefined,
    customerName: raw?.customerName,
    targetQty:
      raw?.targetQty !== undefined && raw?.targetQty !== null ? Number(raw?.targetQty) : undefined,
    completedQty:
      raw?.completedQty !== undefined && raw?.completedQty !== null
        ? Number(raw?.completedQty)
        : undefined,
    alreadyShipped:
      raw?.alreadyShipped !== undefined && raw?.alreadyShipped !== null
        ? Number(raw?.alreadyShipped)
        : undefined,
    shippableQty:
      raw?.shippableQty !== undefined && raw?.shippableQty !== null
        ? Number(raw?.shippableQty)
        : undefined,
    currentStock:
      raw?.currentStock !== undefined && raw?.currentStock !== null
        ? Number(raw?.currentStock)
        : undefined,
    status: raw?.status !== undefined && raw?.status !== null ? Number(raw?.status) : undefined,
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

export function getShippableOrders() {
  return request.get<ApiResponse<any[]>>('/product-stock/shippable-orders').then((res) => ({
    ...res,
    data: (res.data || []).map(normalizeShippableOrder),
  }))
}

export function getProductReceiveRecordList(params: {
  pageNum?: number
  pageSize?: number
  pId?: number
  batchNo?: string
}) {
  return request
    .get<ApiResponse<PageResult<any>>>('/product-stock/receive-records', { params })
    .then((res) => ({
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
  return request
    .get<ApiResponse<PageResult<any>>>('/product-stock/ship-records', { params })
    .then((res) => ({
      ...res,
      data: {
        ...res.data,
        records: (res.data.records || []).map(normalizeShipRecord),
      },
    }))
}

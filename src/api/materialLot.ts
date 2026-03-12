import type { ApiResponse } from './request'
import request from './request'

// 进货批次信息
export interface MaterialLot {
  lotId: number
  lotNo: string
  mId: number
  mName?: string
  mid: number
  mname?: string
  supId: number
  supName?: string
  arrivalQty: number
  lotQty: number
  receivedQty?: number
  qcStatus: number
  status: number
  statusLabel?: string
  arrivalTime?: string
  createTime?: string
  expiryDate: string
  expireDate: string
  produceDate?: string | null
  remainDays?: number
  unit?: string
  updateTime?: string
}

// 进货批次表单
export interface MaterialLotForm {
  lotId?: number
  lotNo?: string
  mId: number
  supId: number
  arrivalQty: number
  qcStatus: number
  arrivalTime: string
  expiryDate: string
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

function normalizeMaterialLot(raw: any): MaterialLot {
  const mId = raw?.mId ?? raw?.mid ?? 0
  const mName = raw?.mName ?? raw?.mname
  const arrivalQty = raw?.arrivalQty ?? raw?.lotQty ?? 0
  const qcStatus = raw?.qcStatus ?? raw?.status ?? 0
  const arrivalTime = raw?.arrivalTime ?? raw?.createTime
  const expiryDate = raw?.expiryDate ?? raw?.expireDate ?? ''

  return {
    ...raw,
    mId,
    mName,
    mid: mId,
    mname: mName,
    arrivalQty,
    lotQty: arrivalQty,
    qcStatus,
    status: qcStatus,
    arrivalTime,
    createTime: arrivalTime,
    expiryDate,
    expireDate: expiryDate,
  }
}

function buildMaterialLotPayload(data: Partial<MaterialLotForm>) {
  return {
    ...(data.lotNo ? { lotNo: data.lotNo } : {}),
    ...(data.mId !== undefined ? { mId: data.mId } : {}),
    ...(data.supId !== undefined ? { supId: data.supId } : {}),
    ...(data.arrivalQty !== undefined ? { arrivalQty: data.arrivalQty } : {}),
    ...(data.qcStatus !== undefined ? { qcStatus: data.qcStatus } : {}),
    ...(data.arrivalTime !== undefined ? { arrivalTime: data.arrivalTime } : {}),
    ...(data.expiryDate !== undefined ? { expiryDate: data.expiryDate } : {}),
  }
}

/**
 * 分页查询进货批次列表
 */
export function getMaterialLotList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  mId?: number
}) {
  return request.get<ApiResponse<PageResult<any>>>('/material-lots', { params }).then((res) => ({
    ...res,
    data: {
      ...res.data,
      records: (res.data.records || []).map(normalizeMaterialLot),
    },
  }))
}

/**
 * 获取进货批次详情
 */
export function getMaterialLotDetail(lotId: number) {
  return request.get<ApiResponse<any>>(`/material-lots/${lotId}`).then((res) => ({
    ...res,
    data: normalizeMaterialLot(res.data),
  }))
}

/**
 * 新增进货批次
 */
export function addMaterialLot(data: MaterialLotForm) {
  return request.post<ApiResponse>(
    '/material-lots',
    buildMaterialLotPayload({
      mId: data.mId,
      supId: data.supId,
      arrivalQty: data.arrivalQty,
      qcStatus: data.qcStatus,
      arrivalTime: data.arrivalTime,
      expiryDate: data.expiryDate,
    }),
  )
}

/**
 * 修改进货批次
 */
export function updateMaterialLot(lotId: number, data: Partial<MaterialLotForm>) {
  return request.put<ApiResponse>(`/material-lots/${lotId}`, buildMaterialLotPayload(data))
}

/**
 * 删除进货批次
 */
export function deleteMaterialLot(lotId: number) {
  return request.delete<ApiResponse>(`/material-lots/${lotId}`)
}

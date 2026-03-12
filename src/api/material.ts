import type { ApiResponse } from './request'
import request from './request'

// 物料信息
export interface Material {
  mId: number
  mCode: string
  mName: string
  mType: string
  mid: number
  mcode: string
  mname: string
  mtype: string
  mtypeLabel?: string
  unit: string
  shelfLife?: number
  specDesc?: string
  status: number
  createTime: string
  updateTime?: string
}

// 物料表单
export interface MaterialForm {
  mId?: number
  mCode?: string
  mName: string
  mType: string
  unit: string
  shelfLife?: number
  specDesc?: string
  status: number
}

// 分页响应
export interface PageResult<T> {
  total: number
  records: T[]
}

function normalizeMaterial(raw: any): Material {
  const mId = raw?.mId ?? raw?.mid ?? 0
  const mCode = raw?.mCode ?? raw?.mcode ?? ''
  const mName = raw?.mName ?? raw?.mname ?? ''
  const mType = String(raw?.mType ?? raw?.mtype ?? '')

  return {
    ...raw,
    mId,
    mCode,
    mName,
    mType,
    mid: mId,
    mcode: mCode,
    mname: mName,
    mtype: mType,
  }
}

/**
 * 分页查询物料列表
 */
export function getMaterialList(params: {
  pageNum?: number
  pageSize?: number
  searchKey?: string
  searchStatus?: number
}) {
  return request.get<ApiResponse<PageResult<any>>>('/materials', { params }).then((res) => ({
    ...res,
    data: {
      ...res.data,
      records: (res.data.records || []).map(normalizeMaterial),
    },
  }))
}

/**
 * 获取物料详情
 */
export function getMaterialDetail(mId: number) {
  return request.get<ApiResponse<any>>(`/materials/${mId}`).then((res) => ({
    ...res,
    data: normalizeMaterial(res.data),
  }))
}

/**
 * 新增物料
 */
export function addMaterial(data: MaterialForm) {
  return request.post<ApiResponse>('/materials', data)
}

/**
 * 修改物料
 */
export function updateMaterial(mId: number, data: Partial<MaterialForm>) {
  return request.put<ApiResponse>(`/materials/${mId}`, data)
}

/**
 * 删除物料
 */
export function deleteMaterial(mId: number) {
  return request.delete<ApiResponse>(`/materials/${mId}`)
}

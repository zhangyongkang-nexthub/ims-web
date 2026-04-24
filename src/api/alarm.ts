import type { ApiResponse } from './request'
import request from './request'

export interface AlarmRecord {
  alarmId: number
  batchNo: string
  deviceCode: string
  processType: string
  alarmLevel: 'INFO' | 'WARNING' | 'CRITICAL' | string
  currentValue: number
  standardRange: string
  alarmMsg: string
  isHandled: number
  handleUser: string | null
  handleTime: string | null
  handleRemark: string | null
  createTime: string
}

export interface AlarmPageResult {
  records: AlarmRecord[]
  total: number
  pages: number
  pageNum: number
  pageSize: number
}

export interface AlarmQueryParams {
  pageNum?: number
  pageSize?: number
  deviceCode?: string
  processType?: string
  isHandled?: number
}

export interface HandleAlarmForm {
  alarmId: number
  handleUser: string
  handleRemark: string
}

export interface AlarmPushData {
  alarmId: number | null
  batchNo: string
  deviceCode: string
  processType: string
  alarmLevel: 'INFO' | 'WARNING' | 'CRITICAL' | string
  currentValue: number
  standardRange: string
  alarmMsg: string
  createTime: string
}

export interface AlarmPushMessage {
  type: string
  data?: AlarmPushData
  timestamp?: number
}

/**
 * 兼容后端 websocket 推送结构，补齐页面表格字段
 */
export function normalizeAlarmPushData(data: AlarmPushData): AlarmRecord {
  return {
    alarmId: data.alarmId ?? 0,
    batchNo: data.batchNo,
    deviceCode: data.deviceCode,
    processType: data.processType,
    alarmLevel: data.alarmLevel,
    currentValue: data.currentValue,
    standardRange: data.standardRange,
    alarmMsg: data.alarmMsg,
    isHandled: 0,
    handleUser: null,
    handleTime: null,
    handleRemark: null,
    createTime: data.createTime,
  }
}

/**
 * 分页查询报警列表
 */
export function getAlarmList(params: AlarmQueryParams) {
  return request.get<ApiResponse<AlarmPageResult>>('/alarm/list', { params })
}

/**
 * 处理报警
 */
export function handleAlarm(data: HandleAlarmForm) {
  return request.post<ApiResponse<null>>('/alarm/handle', data)
}

/**
 * 获取未处理报警数量
 */
export function getUnhandledAlarmCount() {
  return request.get<ApiResponse<number>>('/alarm/count-unhandled')
}

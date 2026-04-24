import { normalizeAlarmPushData, type AlarmPushMessage, type AlarmRecord } from '@/api/alarm'
import { ElNotification } from 'element-plus'

const ALARM_PUSH_EVENT = 'alarm-push'
const DASHBOARD_PUSH_EVENT = 'dashboard-push'
const AI_ANALYSIS_PUSH_EVENT = 'ai-analysis-push'
const ALARM_WS_URL = import.meta.env.VITE_ALARM_WS_URL || 'ws://localhost:8080/ws/alarm'

const alarmEventBus = new EventTarget()

export interface DashboardDeviceMetrics {
  deviceCode?: string
  processType?: string
  batchNo?: string
  value?: number
  ts?: number
  [key: string]: string | number | undefined
}

export type DashboardDeviceValue = number | DashboardDeviceMetrics

export interface DashboardPushData {
  productionCount: number
  devices: Record<string, DashboardDeviceValue>
  timestamp: number
}

export interface AiAnalysisPushData {
  deviceCode: string
  batchNo: string
  processType: string
  riskScore: number
  riskLevel: string
  reason: string
  suggestion: string
  finalDecision: string
  statsSnapshot: string
  analysisTime: string
}

export interface WebSocketMessage {
  type: string
  data?: AlarmPushMessage['data'] | DashboardPushData | Record<string, unknown>
  timestamp?: number
}

type UnknownRecord = Record<string, unknown>

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function pickNestedData(payload: unknown): unknown {
  if (!isObject(payload)) return payload
  if (isObject(payload.data)) return payload.data
  return payload
}

function parseAlarmData(payload: unknown) {
  const candidate = pickNestedData(payload)
  if (!isObject(candidate)) return null

  if (typeof candidate.alarmMsg === 'string' && typeof candidate.deviceCode === 'string') {
    return candidate as unknown as AlarmPushMessage['data']
  }

  if (isObject(candidate.alarm)) {
    const alarm = pickNestedData(candidate.alarm)
    if (isObject(alarm) && typeof alarm.alarmMsg === 'string' && typeof alarm.deviceCode === 'string') {
      return alarm as unknown as AlarmPushMessage['data']
    }
  }

  return null
}

function parseDashboardData(payload: unknown) {
  const candidate = pickNestedData(payload)
  if (!isObject(candidate)) return null
  if (!isObject(candidate.devices)) return null

  return candidate as unknown as DashboardPushData
}

function parseAiAnalysisData(payload: unknown) {
  const candidate = pickNestedData(payload)
  if (!isObject(candidate)) return null

  if (
    typeof candidate.deviceCode === 'string' &&
    typeof candidate.riskLevel === 'string' &&
    typeof candidate.finalDecision === 'string'
  ) {
    return candidate as unknown as AiAnalysisPushData
  }

  return null
}

let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let started = false

function emitAlarmPush(alarm: AlarmRecord, raw: AlarmPushMessage) {
  alarmEventBus.dispatchEvent(
    new CustomEvent(ALARM_PUSH_EVENT, {
      detail: {
        alarm,
        raw,
      },
    }),
  )
}

function emitDashboardPush(data: DashboardPushData) {
  alarmEventBus.dispatchEvent(
    new CustomEvent(DASHBOARD_PUSH_EVENT, {
      detail: data,
    }),
  )
}

function emitAiAnalysisPush(data: AiAnalysisPushData) {
  alarmEventBus.dispatchEvent(
    new CustomEvent(AI_ANALYSIS_PUSH_EVENT, {
      detail: data,
    }),
  )
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function scheduleReconnect() {
  clearReconnectTimer()
  reconnectTimer = window.setTimeout(() => {
    connect()
  }, 3000)
}

function connect() {
  clearReconnectTimer()

  if (ws) {
    ws.close()
    ws = null
  }

  ws = new WebSocket(ALARM_WS_URL)

  ws.onopen = () => {
    console.log('报警 WebSocket 已连接')
  }

  ws.onmessage = (event: MessageEvent<string>) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage
      const normalizedType = String(message.type || '').toLowerCase()

      if (normalizedType === 'connect') {
        console.log('✅ WebSocket 已连接')
        return
      }

      if (normalizedType === 'alarm' || normalizedType === 'alert' || normalizedType === 'warning') {
        const alarmData = parseAlarmData(message.data)
        if (!alarmData) return
        const alarm = normalizeAlarmPushData(alarmData)
        ElNotification({
          title: '新异常报警',
          message: `${alarm.deviceCode} - ${alarm.alarmMsg}`,
          type: 'warning',
          duration: 5000,
        })
        emitAlarmPush(alarm, {
          type: 'alarm',
          data: alarmData,
          timestamp: message.timestamp,
        })
        return
      }

      if (normalizedType === 'dashboard') {
        const dashboardData = parseDashboardData(message.data)
        if (!dashboardData) return
        emitDashboardPush({
          ...dashboardData,
          timestamp: dashboardData.timestamp || message.timestamp || Date.now(),
        })
        return
      }

      if (normalizedType === 'ai_analysis') {
        const aiData = parseAiAnalysisData(message.data || message)
        if (!aiData) return
        emitAiAnalysisPush(aiData)
      }
    } catch (error) {
      console.error('报警推送解析失败:', error)
    }
  }

  ws.onerror = (event) => {
    console.error('报警 WebSocket 错误:', event)
  }

  ws.onclose = () => {
    if (!started) return
    console.log('报警 WebSocket 已关闭，准备重连')
    scheduleReconnect()
  }
}

export function startAlarmWebSocket() {
  if (started) return
  started = true
  connect()
}

export function stopAlarmWebSocket() {
  started = false
  clearReconnectTimer()
  if (ws) {
    ws.onclose = null
    ws.close()
    ws = null
  }
}

export function onAlarmPush(listener: (alarm: AlarmRecord, raw: AlarmPushMessage) => void) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ alarm: AlarmRecord; raw: AlarmPushMessage }>
    listener(customEvent.detail.alarm, customEvent.detail.raw)
  }

  alarmEventBus.addEventListener(ALARM_PUSH_EVENT, handler)
  return () => alarmEventBus.removeEventListener(ALARM_PUSH_EVENT, handler)
}

export function onDashboardPush(listener: (data: DashboardPushData) => void) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<DashboardPushData>
    listener(customEvent.detail)
  }

  alarmEventBus.addEventListener(DASHBOARD_PUSH_EVENT, handler)
  return () => alarmEventBus.removeEventListener(DASHBOARD_PUSH_EVENT, handler)
}

export function onAiAnalysisPush(listener: (data: AiAnalysisPushData) => void) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<AiAnalysisPushData>
    listener(customEvent.detail)
  }

  alarmEventBus.addEventListener(AI_ANALYSIS_PUSH_EVENT, handler)
  return () => alarmEventBus.removeEventListener(AI_ANALYSIS_PUSH_EVENT, handler)
}

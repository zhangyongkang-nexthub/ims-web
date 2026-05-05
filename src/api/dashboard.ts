import type { ApiResponse } from './request'
import request from './request'

export type DashboardRange = 'today' | '7d' | '30d'

export interface TrendItem {
  date?: string
  day?: string
  label?: string
  value?: number
  count?: number
  total?: number
  qualifiedCount?: number
  qualificationRate?: number
  [key: string]: unknown
}

export interface AlarmStatsPayload {
  totalCount?: number
  unhandledCount?: number
  criticalCount?: number
  trend?: TrendItem[]
  dailyTrend?: TrendItem[]
  [key: string]: unknown
}

export interface ProductionStatsPayload {
  totalOutput?: number
  qualifiedOutput?: number
  qualificationRate?: number
  trend?: TrendItem[]
  dailyTrend?: TrendItem[]
  [key: string]: unknown
}

export interface EquipmentOverviewPayload {
  totalCount?: number
  normalCount?: number
  warningCount?: number
  faultCount?: number
  statusDistribution?: Array<Record<string, unknown>>
  [key: string]: unknown
}

export interface RepairStatsPayload {
  totalCount?: number
  pendingCount?: number
  processingCount?: number
  completedCount?: number
  aiCreatedCount?: number
  manualCreatedCount?: number
  [key: string]: unknown
}

export function getAlarmStats(range: DashboardRange = '7d') {
  return request.get<ApiResponse<AlarmStatsPayload>>('/dashboard/alarm-stats', {
    params: { range },
  })
}

export function getProductionStats(range: DashboardRange = '7d') {
  return request.get<ApiResponse<ProductionStatsPayload>>('/dashboard/production-stats', {
    params: { range },
  })
}

export function getEquipmentOverview() {
  return request.get<ApiResponse<EquipmentOverviewPayload>>('/dashboard/equipment-overview')
}

export function getRepairStats(range: DashboardRange = '7d') {
  return request.get<ApiResponse<RepairStatsPayload>>('/dashboard/repair-stats', {
    params: { range },
  })
}
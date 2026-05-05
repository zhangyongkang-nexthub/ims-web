import type { ApiResponse } from './request'
import request from './request'

export interface BatchQualityBasicInfo {
  batchNo: string
  woNo?: string
  productName?: string
  actualQty?: number
  goodQty?: number
  badQty?: number
  yieldRate?: number
  batchStatus?: number | string
  batchStatusLabel?: string
  startTime?: string
  endTime?: string
}

export interface BatchStationStat {
  stationNo?: number
  stationName?: string
  deviceCode: string
  processType?: string
  parameterName?: string
  unit?: string
  targetValue?: number
  minThreshold?: number
  maxThreshold?: number
  sampleCount?: number
  mean?: number
  stdDev?: number
  min?: number
  max?: number
  minVal?: number
  maxVal?: number
  outOfRangeCount?: number
  outOfSpecRate?: number
  outOfRangeRate?: number
  cpk?: number
}

export interface BatchAlarmDistribution {
  alarmType?: string
  alarmLevel?: string
  alarmCount: number
}

export interface BatchAiAssessment {
  grade?: 'A' | 'B' | 'C' | 'D' | string
  score?: number
  summary?: string
  rootCause?: string
  suggestions?: string[]
}

export interface BatchQualityReport {
  basicInfo?: BatchQualityBasicInfo
  stationStats?: BatchStationStat[]
  alarmDistribution?: BatchAlarmDistribution[]
  aiAssessment?: BatchAiAssessment
  cacheTtlSeconds?: number
  generatedAt?: string
}

// 后端当前返回的原始结构（扁平报告体）
export interface BatchQualityReportRaw {
  batchNo?: string
  targetQty?: number
  actualQty?: number
  badQty?: number
  yieldRate?: number
  batchStatus?: string | number
  startTime?: string
  endTime?: string
  stationStatsList?: BatchStationStat[]
  totalAlarmCount?: number
  alarmDistribution?: BatchAlarmDistribution[]
  qualityGrade?: string
  qualityScore?: number
  aiReportSummary?: string
  aiRootCauseAnalysis?: string
  aiImprovementSuggestion?: string
  reportTime?: string
}

export interface BatchTimeSeriesPoint {
  ts: number
  value: number
  deviceCode?: string
  processType?: string
  batchNo?: string
}

export function getBatchQualityReport(batchNo: string) {
  return request.get<ApiResponse<BatchQualityReportRaw | BatchQualityReport>>(
    `/batch-quality/report/${batchNo}`,
  )
}

export function getBatchQualityTimeSeries(batchNo: string, device: string) {
  return request.get<ApiResponse<BatchTimeSeriesPoint[]>>(`/batch-quality/timeseries/${batchNo}/${device}`)
}

export function clearBatchQualityCache(batchNo: string) {
  return request.delete<ApiResponse<null>>(`/batch-quality/cache/${batchNo}`)
}

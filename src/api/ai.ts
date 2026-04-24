import type { ApiResponse } from './request'
import request from './request'

export interface AiAnalysisResult {
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

export interface AiAnalyzeRequest {
  batchNo: string
  deviceCode: string
  processType: string
  mean: number
  variance: number
  maxVal: number
  minVal: number
  sampleCount: number
  windowStartTime: number
  windowEndTime: number
}

export interface AiHistoryPageResult {
  records: AiAnalysisResult[]
  total: number
  pages: number
  pageNum: number
  pageSize: number
}

export function triggerAiAnalyze(data: AiAnalyzeRequest) {
  return request.post<ApiResponse<AiAnalysisResult>>('/ai/analyze', data)
}

export function getAiLatest(deviceCode: string) {
  return request.get<ApiResponse<AiAnalysisResult>>(`/ai/latest/${deviceCode}`)
}

export function getAiHistory(params: {
  pageNum?: number
  pageSize?: number
  deviceCode?: string
  riskLevel?: string
}) {
  return request.get<ApiResponse<AiHistoryPageResult>>('/ai/history', { params })
}

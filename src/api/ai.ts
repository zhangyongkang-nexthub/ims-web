import type { ApiResponse } from './request'
import request from './request'

export type ProcessType =
  | 'MIXING'
  | 'STERILIZING'
  | 'FILLING'
  | 'SEALING'
  | 'LABELING'
  | 'PACKAGING'

export type DecisionType = 'RULE' | 'AI' | 'FALLBACK'

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

export interface AiChatRequest {
  question: string
}

export interface AiChatResponse {
  question: string
  generatedSql: string
  queryResult: Array<Record<string, unknown>>
  answer: string
  timestamp: string
}

export interface AiHistoryPageResult {
  records: AiAnalysisResult[]
  total: number
  pages: number
  pageNum: number
  pageSize: number
}

export interface PageResult<T> {
  records: T[]
  total: number
  pages?: number
  pageNum?: number
  pageSize?: number
}

export interface AiDecisionRecord {
  decisionId: number
  refDeviceCode: string
  decisionType: DecisionType
  riskLevel: string
  suggestionContent: string
  isAdopted: 0 | 1 | 2
  createTime: string
}

export interface AiDecisionFeedbackForm {
  isAdopted: 1 | 2
  handleUser: string
}

export interface AiKnowledgeItem {
  kbId: number
  symptomKeyword: string
  processType: ProcessType
  possibleCause: string
  solutionSuggestion: string
  expertLevel: number
  hitCount: number
  source: 'MANUAL' | 'AI_FEEDBACK'
}

export interface AiKnowledgeForm {
  symptomKeyword: string
  processType: ProcessType
  possibleCause: string
  solutionSuggestion: string
  expertLevel: number
}

export interface AiRuleItem {
  ruleId: number
  ruleName: string
  metricName: 'fill_std' | 'speed' | 'temp' | string
  operator: '>' | '<' | '>=' | '<='
  thresholdValue: number
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY'
  action: string
  skipLlm: 0 | 1
  priority: number
  isActive: 0 | 1
}

export interface AiRuleForm {
  ruleName: string
  metricName: 'fill_std' | 'speed' | 'temp' | string
  operator: '>' | '<' | '>=' | '<='
  thresholdValue: number
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY'
  action: string
  skipLlm: 0 | 1
  priority: number
  isActive: 0 | 1
}

export interface AiModelConfig {
  configId: number
  configName: string
  modelName: string
  temperature: number
  isActive: 0 | 1
}

export interface AiModelConfigForm {
  configId?: number
  configName: string
  modelName: string
  temperature: number
}

export type DeviceTrend = 'UP' | 'DOWN' | 'STABLE'
export type DeviceUrgency = 'HIGH' | 'MEDIUM' | 'LOW'

export interface DeviceDailySummary {
  deviceCode: string
  deviceType: string
  equipName: string
  sampleCount: number
  mean: number
  stdDev: number
  outOfRangeRate: number
  alarmCount: number
  healthScore: number
  trend: DeviceTrend
  runningDays: number
}

export interface DeviceAlarmTopItem {
  deviceCode: string
  deviceType: string
  alarmCount: number
  topAlarmMsg: string
}

export interface DeviceMaintenanceSuggestion {
  deviceCode: string
  equipName: string
  urgency: DeviceUrgency
  suggestion: string
  suggestedTime: string
  reason: string
}

export interface DeviceDailyReport {
  reportDate: string
  generateTime: string
  deviceSummaries: DeviceDailySummary[]
  alarmTopDevices: DeviceAlarmTopItem[]
  aiDailyOverview: string
  maintenanceSuggestions: DeviceMaintenanceSuggestion[]
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

export function getAiDecisions(params: {
  pageNum?: number
  pageSize?: number
  deviceCode?: string
  decisionType?: DecisionType
}) {
  return request.get<ApiResponse<PageResult<AiDecisionRecord>>>('/ai/decisions', { params })
}

export function submitAiDecisionFeedback(decisionId: number, data: AiDecisionFeedbackForm) {
  return request.post<ApiResponse<null>>(`/ai/decisions/${decisionId}/feedback`, data)
}

export function getAiKnowledgeList(params: {
  pageNum?: number
  pageSize?: number
  keyword?: string
  processType?: ProcessType
}) {
  return request.get<ApiResponse<PageResult<AiKnowledgeItem>>>('/ai/knowledge', { params })
}

export function createAiKnowledge(data: AiKnowledgeForm) {
  return request.post<ApiResponse<null>>('/ai/knowledge', data)
}

export function updateAiKnowledge(kbId: number, data: AiKnowledgeForm) {
  return request.put<ApiResponse<null>>(`/ai/knowledge/${kbId}`, data)
}

export function deleteAiKnowledge(kbId: number) {
  return request.delete<ApiResponse<null>>(`/ai/knowledge/${kbId}`)
}

export function searchAiKnowledge(params: { keyword: string; processType?: ProcessType }) {
  return request.get<ApiResponse<AiKnowledgeItem[]>>('/ai/knowledge/search', { params })
}

export function getAiRules() {
  return request.get<ApiResponse<AiRuleItem[]>>('/ai/rules')
}

export function createAiRule(data: AiRuleForm) {
  return request.post<ApiResponse<null>>('/ai/rules', data)
}

export function updateAiRule(ruleId: number, data: AiRuleForm) {
  return request.put<ApiResponse<null>>(`/ai/rules/${ruleId}`, data)
}

export function deleteAiRule(ruleId: number) {
  return request.delete<ApiResponse<null>>(`/ai/rules/${ruleId}`)
}

export function getAiModelConfigs() {
  return request.get<ApiResponse<AiModelConfig[]>>('/ai/model-configs')
}

export function saveAiModelConfig(data: AiModelConfigForm) {
  return request.post<ApiResponse<null>>('/ai/model-configs', data)
}

export function activateAiModelConfig(configId: number) {
  return request.post<ApiResponse<null>>(`/ai/model-configs/${configId}/activate`)
}

export function chatWithAi(data: AiChatRequest) {
  return request.post<ApiResponse<AiChatResponse>>('/ai/chat', data)
}

export function getLatestDeviceDailyReport() {
  return request.get<ApiResponse<DeviceDailyReport>>('/device-report/daily/latest')
}

export function getDeviceDailyReportByDate(date?: string) {
  return request.get<ApiResponse<DeviceDailyReport>>('/device-report/daily', {
    params: date ? { date } : undefined,
  })
}

export function getTodayDeviceDailyReport() {
  return request.get<ApiResponse<DeviceDailyReport>>('/device-report/daily/today')
}

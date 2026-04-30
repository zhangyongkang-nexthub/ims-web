import type { ApiResponse } from './request'
import request from './request'

export interface PageResult<T> {
  total: number
  records: T[]
}

export interface Team {
  teamId: string
  teamName: string
  leaderId?: number
  leaderName?: string
  memberCount?: number
  remark?: string
}

export interface TeamMember {
  userId: number
  nickname: string
  employeeNo?: string
  isLeader?: boolean
}

export interface WorkerUser {
  userId: number
  nickname: string
  employeeNo?: string
}

export interface TeamForm {
  teamName: string
  leaderId?: number
  remark?: string
}

export interface Shift {
  shiftId: string
  shiftName: string
  startTime: string
  endTime: string
  isActive: number
  isActiveLabel?: string
}

export interface ShiftForm {
  shiftName: string
  startTime: string
  endTime: string
  isActive: number
}

export interface Schedule {
  scheduleId: string
  startDate: string
  endDate?: string
  repeatDays?: string
  repeatDaysLabel?: string
  shiftId: string
  shiftName?: string
  userId: number
  userName?: string
  teamName?: string
  stationId: number
  stationName?: string
  createTime?: string
}

export interface ScheduleForm {
  startDate: string
  endDate?: string
  repeatDays?: string
  shiftId: string | number
  userId: number
  stationId?: number
}

export interface AvailableUser {
  userId: number
  nickname: string
  teamName?: string
}

export interface UserAgenda {
  schedules: Array<{ scheduleId: string; shiftName?: string; stationName?: string }>
  productionBatches: Array<{ batchId: string; batchNo?: string; woNo?: string; startTime?: string }>
  repairOrders: Array<{
    repairId: string
    orderNo?: string
    faultDesc?: string
    status?: number
    statusLabel?: string
  }>
}

export interface Handover {
  handoverId: string
  stationId: number
  stationName?: string
  batchId: string
  batchNo?: string
  fromUserId: number
  fromUserName?: string
  toUserId: number
  toUserName?: string
  handoverContext?: string
  handoverTime?: string
}

export interface HandoverForm {
  stationId: number
  batchId?: string
  fromUserId: number
  toUserId: number
  handoverContext?: string
}

export function getTeamList(params: { pageNum?: number; pageSize?: number; searchKey?: string }) {
  return request.get<ApiResponse<PageResult<Team>>>('/teams', { params })
}

export function addTeam(data: TeamForm) {
  return request.post<ApiResponse>('/teams', data)
}

export function updateTeam(teamId: string | number, data: Partial<TeamForm>) {
  return request.put<ApiResponse>(`/teams/${teamId}`, data)
}

export function deleteTeam(teamId: string | number) {
  return request.delete<ApiResponse>(`/teams/${teamId}`)
}

export function assignTeamMember(teamId: string | number, userId: number) {
  return request.put<ApiResponse>(`/teams/${teamId}/assign`, null, { params: { userId } })
}

export function removeTeamMember(userId: number) {
  return request.put<ApiResponse>('/teams/remove-user', null, { params: { userId } })
}

export function getTeamMembers(params: { teamId: string | number }) {
  return request.get<ApiResponse<TeamMember[]>>('/schedules/team-members', { params })
}

export function getScheduleWorkers() {
  return request.get<ApiResponse<WorkerUser[]>>('/schedules/workers')
}

export function getShiftList(params: { pageNum?: number; pageSize?: number }) {
  return request.get<ApiResponse<PageResult<Shift>>>('/shifts', { params })
}

export function addShift(data: ShiftForm) {
  return request.post<ApiResponse>('/shifts', data)
}

export function updateShift(shiftId: string | number, data: Partial<ShiftForm>) {
  return request.put<ApiResponse>(`/shifts/${shiftId}`, data)
}

export function deleteShift(shiftId: string | number) {
  return request.delete<ApiResponse>(`/shifts/${shiftId}`)
}

export function getScheduleList(params: {
  pageNum?: number
  pageSize?: number
  workDate?: string
  userId?: number
  stationId?: number
  shiftId?: string | number
}) {
  return request.get<ApiResponse<PageResult<Schedule>>>('/schedules', { params })
}

export function addSchedule(data: ScheduleForm) {
  return request.post<ApiResponse>('/schedules', data)
}

export function addScheduleBatch(data: ScheduleForm[]) {
  return request.post<ApiResponse>('/schedules/batch', data)
}

export function addScheduleBatchByTeam(params: {
  teamId: string | number
  shiftId: string | number
  startDate: string
  endDate?: string
  repeatDays?: string
  stationId?: number
}) {
  return request.post<ApiResponse>('/schedules/batch-by-team', null, { params })
}

export function updateSchedule(scheduleId: string | number, data: Partial<ScheduleForm>) {
  return request.put<ApiResponse>(`/schedules/${scheduleId}`, data)
}

export function deleteSchedule(scheduleId: string | number) {
  return request.delete<ApiResponse>(`/schedules/${scheduleId}`)
}

export function getAvailableUsers(params: { workDate: string; shiftId?: string | number }) {
  return request.get<ApiResponse<AvailableUser[]>>('/schedules/available-users', { params })
}

export function getDailySchedule(params: {
  workDate: string
  stationId?: number
  shiftId?: string | number
  pageNum?: number
  pageSize?: number
}) {
  return request.get<ApiResponse<PageResult<Schedule>>>('/schedules/daily', { params })
}

export function getUserAgenda(params: { userId: number; workDate: string }) {
  return request.get<ApiResponse<UserAgenda>>('/schedules/user-agenda', { params })
}

export function getHandoverList(params: { pageNum?: number; pageSize?: number; batchId?: string; stationId?: number }) {
  return request.get<ApiResponse<PageResult<Handover>>>('/handovers', { params })
}

export function addHandover(data: HandoverForm) {
  return request.post<ApiResponse>('/handovers', data)
}

export function deleteHandover(handoverId: string | number) {
  return request.delete<ApiResponse>(`/handovers/${handoverId}`)
}

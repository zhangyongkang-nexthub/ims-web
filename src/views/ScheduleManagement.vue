<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>排班与交接班管理</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="班组管理" name="team">
          <div class="search-form">
            <el-input v-model="teamSearch.searchKey" placeholder="班组名称" clearable class="search-input" />
            <el-button type="primary" @click="handleTeamSearch">搜索</el-button>
            <el-button @click="handleTeamReset">重置</el-button>
            <el-button type="primary" @click="openTeamDialog('add')">新增班组</el-button>
          </div>

          <el-table :data="teamTable" stripe v-loading="teamLoading">
            <el-table-column prop="teamName" label="班组名称" width="170" />
            <el-table-column prop="leaderName" label="组长" width="130" />
            <el-table-column prop="memberCount" label="成员数" width="90" align="center" />
            <el-table-column prop="remark" label="备注" min-width="220" />
            <el-table-column label="操作" width="230" fixed="right">
              <template #default="{ row }">
                <el-button link type="success" size="small" @click="openTeamMemberDialog(row)">组员</el-button>
                <el-button link type="primary" size="small" @click="openTeamDialog('edit', row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDeleteTeam(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="teamPagination.pageNum"
            v-model:page-size="teamPagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="teamPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadTeamList"
          />
        </el-tab-pane>

        <el-tab-pane label="班次定义" name="shift">
          <div class="search-form">
            <el-button type="primary" @click="openShiftDialog('add')">新增班次</el-button>
          </div>

          <el-table :data="shiftTable" stripe v-loading="shiftLoading">
            <el-table-column prop="shiftName" label="班次名称" width="180" />
            <el-table-column prop="startTime" label="开始时间" width="140" />
            <el-table-column prop="endTime" label="结束时间" width="140" />
            <el-table-column prop="isActiveLabel" label="状态" width="100">
              <template #default="{ row }">{{ row.isActiveLabel || (row.isActive === 1 ? '启用' : '停用') }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openShiftDialog('edit', row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDeleteShift(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="排班管理" name="schedule">
          <div class="search-form">
            <el-date-picker
              v-model="scheduleSearch.workDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="按某天展开"
              class="search-select"
            />
            <el-select v-model="scheduleSearch.userId" placeholder="人员" clearable filterable class="search-select">
              <el-option v-for="u in userList" :key="u.id" :label="u.nickname" :value="u.id" />
            </el-select>
            <el-select v-model="scheduleSearch.stationId" placeholder="工位" clearable class="search-select">
              <el-option v-for="s in stationList" :key="s.stationId" :label="s.stationName" :value="s.stationId" />
            </el-select>
            <el-select v-model="scheduleSearch.shiftId" placeholder="班次" clearable class="search-select">
              <el-option v-for="s in shiftTable" :key="s.shiftId" :label="s.shiftName" :value="s.shiftId" />
            </el-select>
            <el-button type="primary" @click="handleScheduleSearch">搜索</el-button>
            <el-button @click="handleScheduleReset">重置</el-button>
            <el-button type="primary" @click="openScheduleDialog('add')">新增规则</el-button>
            <el-button type="success" @click="openBatchByTeamDialog">按班组批量排班</el-button>
            <el-button type="warning" @click="openAvailableDialog">空闲人员</el-button>
            <el-button type="info" @click="openAgendaDialog">人员全貌</el-button>
          </div>

          <el-table :data="scheduleTable" stripe v-loading="scheduleLoading">
            <el-table-column prop="startDate" label="开始日期" width="120">
              <template #default="{ row }">{{ row.startDate || '-' }}</template>
            </el-table-column>
            <el-table-column prop="endDate" label="结束日期" width="120">
              <template #default="{ row }">{{ row.endDate || row.startDate || '-' }}</template>
            </el-table-column>
            <el-table-column prop="repeatDaysLabel" label="重复规则" width="170">
              <template #default="{ row }">{{ row.repeatDaysLabel || row.repeatDays || '每天' }}</template>
            </el-table-column>
            <el-table-column prop="shiftName" label="班次" width="120" />
            <el-table-column prop="userName" label="人员" width="120" />
            <el-table-column prop="teamName" label="班组" width="120" />
            <el-table-column prop="stationName" label="工位" width="140" />
            <el-table-column prop="createTime" label="创建时间" min-width="170" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openScheduleDialog('edit', row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDeleteSchedule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="schedulePagination.pageNum"
            v-model:page-size="schedulePagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="schedulePagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadScheduleList"
          />
        </el-tab-pane>

        <el-tab-pane label="交接班管理" name="handover">
          <div class="search-form">
            <el-input v-model="handoverSearch.batchId" placeholder="批次ID" clearable class="search-input" />
            <el-select v-model="handoverSearch.stationId" placeholder="工位" clearable class="search-select">
              <el-option v-for="s in stationList" :key="s.stationId" :label="s.stationName" :value="s.stationId" />
            </el-select>
            <el-button type="primary" @click="handleHandoverSearch">搜索</el-button>
            <el-button @click="handleHandoverReset">重置</el-button>
            <el-button type="primary" @click="openHandoverDialog">新增交接班</el-button>
          </div>

          <el-table :data="handoverTable" stripe v-loading="handoverLoading">
            <el-table-column prop="stationName" label="工位" width="140" />
            <el-table-column prop="batchNo" label="批次号" width="170" />
            <el-table-column prop="fromUserName" label="交班人" width="120" />
            <el-table-column prop="toUserName" label="接班人" width="120" />
            <el-table-column prop="handoverContext" label="交接内容" min-width="220" />
            <el-table-column prop="handoverTime" label="交接时间" width="170" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteHandover(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="handoverPagination.pageNum"
            v-model:page-size="handoverPagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="handoverPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @change="loadHandoverList"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="teamDialogVisible" :title="teamDialogTitle" width="460px">
      <el-form ref="teamFormRef" :model="teamForm" :rules="teamRules" label-width="90px">
        <el-form-item label="班组名称" prop="teamName"><el-input v-model="teamForm.teamName" /></el-form-item>
        <el-form-item label="组长">
          <el-select v-model="teamForm.leaderId" clearable filterable>
            <el-option v-for="u in userList" :key="u.id" :label="u.nickname" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="teamForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="teamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTeam">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="teamMemberDialogVisible" :title="teamMemberDialogTitle" width="620px">
      <div class="search-form" style="margin-bottom: 10px">
        <el-select v-model="memberAssignUserId" placeholder="选择用户加入班组" filterable class="search-select">
          <el-option v-for="u in assignableUsers" :key="u.id" :label="u.nickname" :value="u.id" />
        </el-select>
        <el-button type="primary" @click="handleAssignTeamMember">加入班组</el-button>
      </div>
      <el-table :data="teamMembers" stripe>
        <el-table-column prop="nickname" label="姓名" width="140" />
        <el-table-column prop="employeeNo" label="工号" width="140" />
        <el-table-column prop="isLeader" label="是否组长" width="100">
          <template #default="{ row }">{{ row.isLeader ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleRemoveTeamMember(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="shiftDialogVisible" :title="shiftDialogTitle" width="460px">
      <el-form ref="shiftFormRef" :model="shiftForm" :rules="shiftRules" label-width="90px">
        <el-form-item label="班次名称" prop="shiftName"><el-input v-model="shiftForm.shiftName" /></el-form-item>
        <el-form-item label="开始时间" prop="startTime"><el-time-picker v-model="shiftForm.startTime" value-format="HH:mm:ss" /></el-form-item>
        <el-form-item label="结束时间" prop="endTime"><el-time-picker v-model="shiftForm.endTime" value-format="HH:mm:ss" /></el-form-item>
        <el-form-item label="是否启用">
          <el-select v-model="shiftForm.isActive">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shiftDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitShift">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="scheduleDialogVisible" :title="scheduleDialogTitle" width="480px">
      <el-form ref="scheduleFormRef" :model="scheduleForm" :rules="scheduleRules" label-width="90px">
        <el-form-item label="开始日期" prop="startDate"><el-date-picker v-model="scheduleForm.startDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="结束日期"><el-date-picker v-model="scheduleForm.endDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="重复规则">
          <el-select v-model="repeatDaysArray" multiple clearable placeholder="不选=每天">
            <el-option label="周一" value="1" />
            <el-option label="周二" value="2" />
            <el-option label="周三" value="3" />
            <el-option label="周四" value="4" />
            <el-option label="周五" value="5" />
            <el-option label="周六" value="6" />
            <el-option label="周日" value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="班次" prop="shiftId">
          <el-select v-model="scheduleForm.shiftId">
            <el-option v-for="s in shiftTable" :key="s.shiftId" :label="s.shiftName" :value="s.shiftId" />
          </el-select>
        </el-form-item>
        <el-form-item label="班组" required>
          <el-select
            v-model="scheduleTeamId"
            filterable
            clearable
            placeholder="请先选择班组"
            @change="handleScheduleTeamChange"
          >
            <el-option v-for="t in teamTable" :key="t.teamId" :label="t.teamName" :value="t.teamId" />
          </el-select>
        </el-form-item>
        <el-form-item label="人员" prop="userId">
          <el-select
            v-model="scheduleForm.userId"
            filterable
            :disabled="!scheduleTeamId"
            :placeholder="scheduleTeamId ? '请选择班组内人员' : '请先选择班组'"
          >
            <el-option v-for="u in scheduleTeamUsers" :key="u.userId" :label="u.nickname" :value="u.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="工位">
          <el-select v-model="scheduleForm.stationId" clearable>
            <el-option v-for="s in stationList" :key="s.stationId" :label="s.stationName" :value="s.stationId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSchedule">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchByTeamDialogVisible" title="按班组批量排班" width="520px">
      <el-form ref="batchByTeamFormRef" :model="batchByTeamForm" :rules="batchByTeamRules" label-width="100px">
        <el-form-item label="班组" prop="teamId">
          <el-select v-model="batchByTeamForm.teamId" filterable>
            <el-option v-for="t in teamTable" :key="t.teamId" :label="t.teamName" :value="t.teamId" />
          </el-select>
        </el-form-item>
        <el-form-item label="班次" prop="shiftId">
          <el-select v-model="batchByTeamForm.shiftId">
            <el-option v-for="s in shiftTable" :key="s.shiftId" :label="s.shiftName" :value="s.shiftId" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate"><el-date-picker v-model="batchByTeamForm.startDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="结束日期"><el-date-picker v-model="batchByTeamForm.endDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="重复规则">
          <el-select v-model="batchRepeatDaysArray" multiple clearable placeholder="不选=每天">
            <el-option label="周一" value="1" />
            <el-option label="周二" value="2" />
            <el-option label="周三" value="3" />
            <el-option label="周四" value="4" />
            <el-option label="周五" value="5" />
            <el-option label="周六" value="6" />
            <el-option label="周日" value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="工位">
          <el-select v-model="batchByTeamForm.stationId" clearable>
            <el-option v-for="s in stationList" :key="s.stationId" :label="s.stationName" :value="s.stationId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchByTeamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchByTeam">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="availableDialogVisible" title="空闲人员查询" width="560px">
      <el-form :model="availableForm" label-width="90px" inline>
        <el-form-item label="日期"><el-date-picker v-model="availableForm.workDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="班次">
          <el-select v-model="availableForm.shiftId" clearable>
            <el-option v-for="s in shiftTable" :key="s.shiftId" :label="s.shiftName" :value="s.shiftId" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="loadAvailableUsers">查询</el-button></el-form-item>
      </el-form>
      <el-table :data="availableUsers" size="small">
        <el-table-column prop="userId" label="用户ID" width="120" />
        <el-table-column prop="nickname" label="姓名" width="140" />
        <el-table-column prop="teamName" label="班组" />
      </el-table>
    </el-dialog>

    <el-dialog v-model="agendaDialogVisible" title="人员工作全貌" width="760px">
      <el-form :model="agendaForm" label-width="90px" inline>
        <el-form-item label="人员">
          <el-select v-model="agendaForm.userId" filterable>
            <el-option v-for="u in userList" :key="u.id" :label="u.nickname" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="agendaForm.workDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item><el-button type="primary" @click="loadUserAgenda">查询</el-button></el-form-item>
      </el-form>

      <el-descriptions title="排班安排" :column="1" border>
        <el-descriptions-item>
          <div v-if="agendaData?.schedules?.length">
            <div v-for="it in agendaData.schedules" :key="it.scheduleId">{{ it.shiftName }} - {{ it.stationName }}</div>
          </div>
          <span v-else>无</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="生产批次" :column="1" border style="margin-top: 12px">
        <el-descriptions-item>
          <div v-if="agendaData?.productionBatches?.length">
            <div v-for="it in agendaData.productionBatches" :key="it.batchId">{{ it.batchNo }} / {{ it.woNo }}</div>
          </div>
          <span v-else>无</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="维修任务" :column="1" border style="margin-top: 12px">
        <el-descriptions-item>
          <div v-if="agendaData?.repairOrders?.length">
            <div v-for="it in agendaData.repairOrders" :key="it.repairId">{{ it.orderNo }} - {{ it.statusLabel }}</div>
          </div>
          <span v-else>无</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="handoverDialogVisible" title="新增交接班" width="500px">
      <el-form ref="handoverFormRef" :model="handoverForm" :rules="handoverRules" label-width="100px">
        <el-form-item label="工位" prop="stationId">
          <el-select v-model="handoverForm.stationId" filterable>
            <el-option v-for="s in stationList" :key="s.stationId" :label="s.stationName" :value="s.stationId" />
          </el-select>
        </el-form-item>
        <el-form-item label="批次ID(可选)"><el-input v-model="handoverForm.batchId" /></el-form-item>
        <el-form-item label="交班人" prop="fromUserId">
          <el-select v-model="handoverForm.fromUserId" filterable>
            <el-option v-for="u in workerList" :key="u.userId" :label="u.nickname" :value="u.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="接班人" prop="toUserId">
          <el-select v-model="handoverForm.toUserId" filterable>
            <el-option v-for="u in workerList" :key="u.userId" :label="u.nickname" :value="u.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="交接内容"><el-input v-model="handoverForm.handoverContext" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handoverDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandover">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  addHandover,
  addSchedule,
  addScheduleBatchByTeam,
  addShift,
  addTeam,
  assignTeamMember,
  deleteHandover,
  deleteSchedule,
  deleteShift,
  deleteTeam,
  getAvailableUsers,
  getDailySchedule,
  getHandoverList,
  getScheduleList,
  getScheduleWorkers,
  getShiftList,
  getTeamList,
  getTeamMembers,
  getUserAgenda,
  removeTeamMember,
  updateSchedule,
  updateShift,
  updateTeam,
  type AvailableUser,
  type Handover,
  type HandoverForm,
  type Schedule,
  type ScheduleForm,
  type Shift,
  type ShiftForm,
  type Team,
  type TeamForm,
  type TeamMember,
  type WorkerUser,
  type UserAgenda,
} from '@/api/schedule'
import { getStationList, type Station } from '@/api/station'
import { getUserList, type User } from '@/api/user'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const activeTab = ref('team')
const userList = ref<User[]>([])
const workerList = ref<WorkerUser[]>([])
const stationList = ref<Station[]>([])

const teamLoading = ref(false)
const teamTable = ref<Team[]>([])
const teamPagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const teamSearch = reactive({ searchKey: '' })

const shiftLoading = ref(false)
const shiftTable = ref<Shift[]>([])

const scheduleLoading = ref(false)
const scheduleTable = ref<Schedule[]>([])
const schedulePagination = reactive({ pageNum: 1, pageSize: 20, total: 0 })
const scheduleSearch = reactive<{ workDate?: string; userId?: number; stationId?: number; shiftId?: string }>({
  workDate: undefined,
  userId: undefined,
  stationId: undefined,
  shiftId: undefined,
})

const handoverLoading = ref(false)
const handoverTable = ref<Handover[]>([])
const handoverPagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const handoverSearch = reactive<{ batchId: string; stationId?: number }>({ batchId: '', stationId: undefined })

const teamDialogVisible = ref(false)
const teamDialogType = ref<'add' | 'edit'>('add')
const teamDialogTitle = ref('新增班组')
const teamFormRef = ref<FormInstance>()
const teamForm = reactive<TeamForm & { teamId?: string }>({ teamId: undefined, teamName: '', leaderId: undefined, remark: '' })
const teamRules = { teamName: [{ required: true, message: '班组名称不能为空', trigger: 'blur' }] }

const teamMemberDialogVisible = ref(false)
const teamMemberDialogTitle = ref('班组成员')
const currentTeamId = ref('')
const teamMembers = ref<TeamMember[]>([])
const memberAssignUserId = ref<number | undefined>()
const assignableUsers = computed(() => {
  const memberIds = new Set(teamMembers.value.map((m) => m.userId))
  return userList.value.filter((u) => !memberIds.has(u.id))
})

const shiftDialogVisible = ref(false)
const shiftDialogType = ref<'add' | 'edit'>('add')
const shiftDialogTitle = ref('新增班次')
const shiftFormRef = ref<FormInstance>()
const shiftForm = reactive<ShiftForm & { shiftId?: string }>({
  shiftId: undefined,
  shiftName: '',
  startTime: '',
  endTime: '',
  isActive: 1,
})
const shiftRules = {
  shiftName: [{ required: true, message: '班次名称不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束时间不能为空', trigger: 'change' }],
}

const scheduleDialogVisible = ref(false)
const scheduleDialogType = ref<'add' | 'edit'>('add')
const scheduleDialogTitle = ref('新增排班规则')
const scheduleFormRef = ref<FormInstance>()
const scheduleForm = reactive<ScheduleForm & { scheduleId?: string }>({
  scheduleId: undefined,
  startDate: '',
  endDate: '',
  repeatDays: '',
  shiftId: '',
  userId: 0,
  stationId: undefined,
})
const scheduleTeamId = ref('')
const scheduleTeamUsers = ref<TeamMember[]>([])
const teamMembersCache = reactive<Record<string, TeamMember[]>>({})
const scheduleRules = {
  startDate: [{ required: true, message: '开始日期不能为空', trigger: 'change' }],
  shiftId: [{ required: true, message: '班次不能为空', trigger: 'change' }],
  userId: [{ required: true, message: '人员不能为空', trigger: 'change' }],
}
const repeatDaysArray = ref<string[]>([])

const batchByTeamDialogVisible = ref(false)
const batchByTeamFormRef = ref<FormInstance>()
const batchByTeamForm = reactive<{
  teamId: string
  shiftId: string
  startDate: string
  endDate?: string
  repeatDays?: string
  stationId?: number
}>({
  teamId: '',
  shiftId: '',
  startDate: '',
  endDate: '',
  repeatDays: '',
  stationId: undefined,
})
const batchRepeatDaysArray = ref<string[]>([])
const batchByTeamRules = {
  teamId: [{ required: true, message: '班组不能为空', trigger: 'change' }],
  shiftId: [{ required: true, message: '班次不能为空', trigger: 'change' }],
  startDate: [{ required: true, message: '开始日期不能为空', trigger: 'change' }],
}

const availableDialogVisible = ref(false)
const availableForm = reactive<{ workDate: string; shiftId?: string }>({ workDate: '', shiftId: undefined })
const availableUsers = ref<AvailableUser[]>([])

const agendaDialogVisible = ref(false)
const agendaForm = reactive<{ userId: number; workDate: string }>({ userId: 0, workDate: '' })
const agendaData = ref<UserAgenda | null>(null)

const handoverDialogVisible = ref(false)
const handoverFormRef = ref<FormInstance>()
const handoverForm = reactive<HandoverForm>({
  stationId: 0,
  batchId: '',
  fromUserId: 0,
  toUserId: 0,
  handoverContext: '',
})
const handoverRules = {
  stationId: [{ required: true, message: '工位不能为空', trigger: 'change' }],
  fromUserId: [{ required: true, message: '交班人不能为空', trigger: 'change' }],
  toUserId: [{ required: true, message: '接班人不能为空', trigger: 'change' }],
}

const loadBaseOptions = async () => {
  const [uRes, sRes, wRes] = await Promise.all([
    getUserList({ pageSize: 1000 }),
    getStationList({ pageSize: 1000 }),
    getScheduleWorkers(),
  ])
  userList.value = uRes.data.records
  stationList.value = sRes.data.records
  workerList.value = wRes.data
}

const loadTeamList = async () => {
  teamLoading.value = true
  try {
    const res = await getTeamList({
      pageNum: teamPagination.pageNum,
      pageSize: teamPagination.pageSize,
      searchKey: teamSearch.searchKey || undefined,
    })
    teamTable.value = res.data.records
    teamPagination.total = res.data.total
  } finally {
    teamLoading.value = false
  }
}

const loadTeamMembers = async (teamId: string) => {
  const res = await getTeamMembers({ teamId })
  teamMembers.value = res.data
}

const loadTeamMembersForSchedule = async (teamId: string) => {
  if (!teamId) return []
  if (!teamMembersCache[teamId]) {
    const res = await getTeamMembers({ teamId })
    teamMembersCache[teamId] = res.data
  }
  return teamMembersCache[teamId]
}

const handleScheduleTeamChange = async (teamId?: string) => {
  scheduleForm.userId = 0
  if (!teamId) {
    scheduleTeamUsers.value = []
    return
  }
  scheduleTeamUsers.value = await loadTeamMembersForSchedule(teamId)
}

const resolveScheduleTeamIdByUser = async (userId: number) => {
  for (const team of teamTable.value) {
    const members = await loadTeamMembersForSchedule(team.teamId)
    if (members.some((m) => m.userId === userId)) {
      return team.teamId
    }
  }
  return ''
}

const loadShiftList = async () => {
  shiftLoading.value = true
  try {
    const res = await getShiftList({ pageNum: 1, pageSize: 100 })
    shiftTable.value = res.data.records
  } finally {
    shiftLoading.value = false
  }
}

const loadScheduleList = async () => {
  scheduleLoading.value = true
  try {
    const params = {
      pageNum: schedulePagination.pageNum,
      pageSize: schedulePagination.pageSize,
      userId: scheduleSearch.userId,
      stationId: scheduleSearch.stationId,
      shiftId: scheduleSearch.shiftId,
    }
    const res = scheduleSearch.workDate
      ? await getDailySchedule({ ...params, workDate: scheduleSearch.workDate })
      : await getScheduleList(params)

    scheduleTable.value = res.data.records
    schedulePagination.total = res.data.total
  } finally {
    scheduleLoading.value = false
  }
}

const loadHandoverList = async () => {
  handoverLoading.value = true
  try {
    const res = await getHandoverList({
      pageNum: handoverPagination.pageNum,
      pageSize: handoverPagination.pageSize,
      batchId: handoverSearch.batchId || undefined,
      stationId: handoverSearch.stationId,
    })
    handoverTable.value = res.data.records
    handoverPagination.total = res.data.total
  } finally {
    handoverLoading.value = false
  }
}

const handleTeamSearch = () => {
  teamPagination.pageNum = 1
  loadTeamList()
}

const handleTeamReset = () => {
  teamSearch.searchKey = ''
  teamPagination.pageNum = 1
  loadTeamList()
}

const openTeamDialog = (type: 'add' | 'edit', row?: Team) => {
  teamDialogType.value = type
  teamDialogTitle.value = type === 'add' ? '新增班组' : '编辑班组'
  if (type === 'add') {
    teamForm.teamId = undefined
    teamForm.teamName = ''
    teamForm.leaderId = undefined
    teamForm.remark = ''
  } else if (row) {
    teamForm.teamId = row.teamId
    teamForm.teamName = row.teamName
    teamForm.leaderId = row.leaderId
    teamForm.remark = row.remark || ''
  }
  teamDialogVisible.value = true
}

const submitTeam = async () => {
  if (!teamFormRef.value) return
  await teamFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (teamDialogType.value === 'add') {
      await addTeam(teamForm)
      ElMessage.success('新增成功')
    } else {
      await updateTeam(teamForm.teamId!, teamForm)
      ElMessage.success('修改成功')
    }
    teamDialogVisible.value = false
    loadTeamList()
  })
}

const handleDeleteTeam = (row: Team) => {
  ElMessageBox.confirm(`确定删除班组「${row.teamName}」吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteTeam(row.teamId)
    ElMessage.success('删除成功')
    loadTeamList()
  }).catch(() => {})
}

const openTeamMemberDialog = async (row: Team) => {
  currentTeamId.value = row.teamId
  teamMemberDialogTitle.value = `${row.teamName} - 成员管理`
  memberAssignUserId.value = undefined
  await loadTeamMembers(row.teamId)
  teamMemberDialogVisible.value = true
}

const handleAssignTeamMember = async () => {
  if (!currentTeamId.value || !memberAssignUserId.value) {
    ElMessage.warning('请先选择用户')
    return
  }
  await assignTeamMember(currentTeamId.value, memberAssignUserId.value)
  ElMessage.success('分配成功')
  memberAssignUserId.value = undefined
  await loadTeamMembers(currentTeamId.value)
  loadTeamList()
}

const handleRemoveTeamMember = async (member: TeamMember) => {
  await removeTeamMember(member.userId)
  ElMessage.success('已移除')
  await loadTeamMembers(currentTeamId.value)
  loadTeamList()
}

const openShiftDialog = (type: 'add' | 'edit', row?: Shift) => {
  shiftDialogType.value = type
  shiftDialogTitle.value = type === 'add' ? '新增班次' : '编辑班次'
  if (type === 'add') {
    shiftForm.shiftId = undefined
    shiftForm.shiftName = ''
    shiftForm.startTime = ''
    shiftForm.endTime = ''
    shiftForm.isActive = 1
  } else if (row) {
    shiftForm.shiftId = row.shiftId
    shiftForm.shiftName = row.shiftName
    shiftForm.startTime = row.startTime
    shiftForm.endTime = row.endTime
    shiftForm.isActive = row.isActive
  }
  shiftDialogVisible.value = true
}

const submitShift = async () => {
  if (!shiftFormRef.value) return
  await shiftFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (shiftDialogType.value === 'add') {
      await addShift(shiftForm)
      ElMessage.success('新增成功')
    } else {
      await updateShift(shiftForm.shiftId!, shiftForm)
      ElMessage.success('修改成功')
    }
    shiftDialogVisible.value = false
    loadShiftList()
  })
}

const handleDeleteShift = (row: Shift) => {
  ElMessageBox.confirm(`确定删除班次「${row.shiftName}」吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteShift(row.shiftId)
    ElMessage.success('删除成功')
    loadShiftList()
  }).catch(() => {})
}

const handleScheduleSearch = () => {
  schedulePagination.pageNum = 1
  loadScheduleList()
}

const handleScheduleReset = () => {
  scheduleSearch.workDate = undefined
  scheduleSearch.userId = undefined
  scheduleSearch.stationId = undefined
  scheduleSearch.shiftId = undefined
  schedulePagination.pageNum = 1
  loadScheduleList()
}

const openScheduleDialog = async (type: 'add' | 'edit', row?: Schedule) => {
  scheduleDialogType.value = type
  scheduleDialogTitle.value = type === 'add' ? '新增排班规则' : '编辑排班规则'
  if (type === 'add') {
    scheduleForm.scheduleId = undefined
    scheduleForm.startDate = ''
    scheduleForm.endDate = ''
    scheduleForm.repeatDays = ''
    scheduleForm.shiftId = ''
    scheduleForm.userId = 0
    scheduleForm.stationId = undefined
    scheduleTeamId.value = ''
    scheduleTeamUsers.value = []
    repeatDaysArray.value = []
  } else if (row) {
    scheduleForm.scheduleId = row.scheduleId
    scheduleForm.startDate = row.startDate
    scheduleForm.endDate = row.endDate || ''
    scheduleForm.repeatDays = row.repeatDays || ''
    scheduleForm.shiftId = row.shiftId
    scheduleForm.userId = row.userId
    scheduleForm.stationId = row.stationId
    repeatDaysArray.value = row.repeatDays ? row.repeatDays.split(',') : []

    const teamId = await resolveScheduleTeamIdByUser(row.userId)
    scheduleTeamId.value = teamId
    if (teamId) {
      scheduleTeamUsers.value = await loadTeamMembersForSchedule(teamId)
    } else {
      scheduleTeamUsers.value = []
      scheduleForm.userId = 0
      ElMessage.warning('未找到该人员所属班组，请重新选择班组和人员')
    }
  }
  scheduleDialogVisible.value = true
}

const submitSchedule = async () => {
  if (!scheduleTeamId.value) {
    ElMessage.warning('请先选择班组，再选择人员')
    return
  }
  if (!scheduleFormRef.value) return
  await scheduleFormRef.value.validate(async (valid) => {
    if (!valid) return
    scheduleForm.repeatDays = repeatDaysArray.value.join(',')
    if (!scheduleForm.endDate) {
      scheduleForm.endDate = scheduleForm.startDate
    }
    if (scheduleDialogType.value === 'add') {
      await addSchedule(scheduleForm)
      ElMessage.success('新增成功')
    } else {
      await updateSchedule(scheduleForm.scheduleId!, scheduleForm)
      ElMessage.success('修改成功')
    }
    scheduleDialogVisible.value = false
    loadScheduleList()
  })
}

const handleDeleteSchedule = (row: Schedule) => {
  ElMessageBox.confirm('确定删除该排班规则吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteSchedule(row.scheduleId)
    ElMessage.success('删除成功')
    loadScheduleList()
  }).catch(() => {})
}

const openBatchByTeamDialog = () => {
  batchByTeamForm.teamId = ''
  batchByTeamForm.shiftId = ''
  batchByTeamForm.startDate = ''
  batchByTeamForm.endDate = ''
  batchByTeamForm.repeatDays = ''
  batchByTeamForm.stationId = undefined
  batchRepeatDaysArray.value = []
  batchByTeamDialogVisible.value = true
}

const submitBatchByTeam = async () => {
  if (!batchByTeamFormRef.value) return
  await batchByTeamFormRef.value.validate(async (valid) => {
    if (!valid) return
    batchByTeamForm.repeatDays = batchRepeatDaysArray.value.join(',')
    await addScheduleBatchByTeam(batchByTeamForm)
    ElMessage.success('班组批量排班成功')
    batchByTeamDialogVisible.value = false
    loadScheduleList()
  })
}

const openAvailableDialog = () => {
  availableForm.workDate = ''
  availableForm.shiftId = undefined
  availableUsers.value = []
  availableDialogVisible.value = true
}

const loadAvailableUsers = async () => {
  if (!availableForm.workDate) {
    ElMessage.warning('请先选择日期')
    return
  }
  const res = await getAvailableUsers({ workDate: availableForm.workDate, shiftId: availableForm.shiftId })
  availableUsers.value = res.data
}

const openAgendaDialog = () => {
  agendaForm.userId = 0
  agendaForm.workDate = ''
  agendaData.value = null
  agendaDialogVisible.value = true
}

const loadUserAgenda = async () => {
  if (!agendaForm.userId || !agendaForm.workDate) {
    ElMessage.warning('请选择人员和日期')
    return
  }
  const res = await getUserAgenda({ userId: agendaForm.userId, workDate: agendaForm.workDate })
  agendaData.value = res.data
}

const handleHandoverSearch = () => {
  handoverPagination.pageNum = 1
  loadHandoverList()
}

const handleHandoverReset = () => {
  handoverSearch.batchId = ''
  handoverSearch.stationId = undefined
  handoverPagination.pageNum = 1
  loadHandoverList()
}

const openHandoverDialog = () => {
  handoverForm.stationId = 0
  handoverForm.batchId = ''
  handoverForm.fromUserId = 0
  handoverForm.toUserId = 0
  handoverForm.handoverContext = ''
  handoverDialogVisible.value = true
}

const submitHandover = async () => {
  if (!handoverFormRef.value) return
  await handoverFormRef.value.validate(async (valid) => {
    if (!valid) return
    await addHandover({
      stationId: handoverForm.stationId,
      fromUserId: handoverForm.fromUserId,
      toUserId: handoverForm.toUserId,
      handoverContext: handoverForm.handoverContext,
      batchId: handoverForm.batchId?.trim() ? handoverForm.batchId.trim() : undefined,
    })
    ElMessage.success('交接班成功')
    handoverDialogVisible.value = false
    loadHandoverList()
  })
}

const handleDeleteHandover = (row: Handover) => {
  ElMessageBox.confirm('确定删除该交接班记录吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteHandover(row.handoverId)
    ElMessage.success('删除成功')
    loadHandoverList()
  }).catch(() => {})
}

onMounted(async () => {
  await Promise.all([loadBaseOptions(), loadShiftList(), loadTeamList()])
  loadScheduleList()
  loadHandoverList()
})
</script>

<style scoped>
.container { padding: 20px; }
.box-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.search-input { width: 220px; }
.search-select { width: 180px; }
.pagination { margin-top: 16px; text-align: right; }
</style>

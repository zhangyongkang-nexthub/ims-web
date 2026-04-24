<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>工艺参数明细管理</span>
          <div>
            <el-button type="primary" @click="openDialog('add')">新增参数</el-button>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="search-form">
        <el-select
          v-model="searchForm.processType"
          placeholder="选择工序类型"
          clearable
          class="search-select"
        >
          <el-option
            v-for="item in processTypeOptions"
            :key="item.dictValue"
            :label="item.dictLabel"
            :value="item.dictValue"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="processType" label="工序类型" width="140">
          <template #default="scope">
            {{ getProcessTypeLabel(scope.row.processType) }}
          </template>
        </el-table-column>
        <el-table-column prop="deviceCode" label="设备" width="160" />
        <el-table-column prop="parameterName" label="参数名称" width="140" />
        <el-table-column prop="targetValue" label="目标值" width="120" />
        <el-table-column prop="minThreshold" label="下限阈值" width="120" />
        <el-table-column prop="maxThreshold" label="上限阈值" width="120" />
        <el-table-column prop="unit" label="单位" width="100">
          <template #default="scope">
            {{ getUnitTypeLabel(scope.row.unit) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)"
              >编辑</el-button
            >
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @change="getList"
        class="pagination"
      />
    </el-card>

    <!-- 编辑/新增对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="45%">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="工序类型" prop="processType">
          <el-select v-model="formData.processType" placeholder="选择工序类型">
            <el-option
              v-for="item in processTypeOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备" prop="deviceCode">
          <el-select v-model="formData.deviceCode" placeholder="请选择设备" filterable>
            <el-option
              v-for="item in deviceList"
              :key="item.deviceId"
              :label="item.deviceCode"
              :value="item.deviceCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="参数名称" prop="parameterName">
          <el-input v-model="formData.parameterName" placeholder="如: temperature / brix / speed" />
        </el-form-item>
        <el-form-item label="目标值" prop="targetValue">
          <el-input-number v-model="formData.targetValue" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="下限阈值" prop="minThreshold">
          <el-input-number v-model="formData.minThreshold" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="上限阈值" prop="maxThreshold">
          <el-input-number v-model="formData.maxThreshold" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-select v-model="formData.unit" placeholder="请选择单位">
            <el-option
              v-for="item in unitTypeOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  addCraftDetail,
  deleteCraftDetail,
  getCraftDetailList,
  updateCraftDetail,
  type CraftDetail,
  type CraftDetailForm,
} from '@/api/craft'
import { getDeviceList, type Device } from '@/api/device'
import { useDictData } from '@/composables/useDictData'
import { DICT_TYPE } from '@/constants/dict'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const craftId = Number(route.params.craftId)

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<CraftDetail[]>([])
const deviceList = ref<Device[]>([])

// 工序类型字典
const {
  options: processTypeOptions,
  getLabel: getProcessTypeLabel,
  load: loadProcessTypeDict,
} = useDictData(DICT_TYPE.PROCESS_TYPE)

const {
  options: unitTypeOptions,
  getLabel: getUnitTypeLabel,
  load: loadUnitTypeDict,
} = useDictData(DICT_TYPE.UNIT_TYPE)

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive<{
  processType: string | undefined
}>({
  processType: undefined,
})

const formData = reactive<CraftDetailForm>({
  recipeId: craftId,
  deviceCode: '',
  processType: '',
  parameterName: '',
  targetValue: 0,
  maxThreshold: 0,
  minThreshold: 0,
  unit: '',
})

const rules = {
  processType: [{ required: true, message: '工序类型不能为空', trigger: 'change' }],
  deviceCode: [{ required: true, message: '设备不能为空', trigger: 'change' }],
  parameterName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
  targetValue: [{ required: true, message: '目标值不能为空', trigger: 'blur' }],
  maxThreshold: [{ required: true, message: '上限阈值不能为空', trigger: 'blur' }],
  minThreshold: [{ required: true, message: '下限阈值不能为空', trigger: 'blur' }],
  unit: [{ required: true, message: '单位不能为空', trigger: 'blur' }],
}

const dialogTitle = ref('新增参数')

const getList = async () => {
  loading.value = true
  try {
    const res = await getCraftDetailList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      recipeId: craftId,
      processType: searchForm.processType,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取工艺参数明细列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.processType = undefined
  pagination.pageNum = 1
  getList()
}

const loadDeviceOptions = async () => {
  try {
    const res = await getDeviceList({ pageNum: 1, pageSize: 1000 })
    deviceList.value = res.data.records
  } catch (error) {
    console.error('加载设备列表失败:', error)
  }
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增参数' : '编辑参数'
  dialogVisible.value = true

  if (type === 'add') {
    formData.id = undefined
    formData.deviceCode = ''
    formData.processType = ''
    formData.parameterName = ''
    formData.targetValue = 0
    formData.maxThreshold = 0
    formData.minThreshold = 0
    formData.unit = ''
  }
}

const handleEdit = (row: CraftDetail) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑参数'
  dialogVisible.value = true

  formData.id = row.id
  formData.recipeId = row.recipeId
  formData.deviceCode = row.deviceCode || ''
  formData.processType = row.processType
  formData.parameterName = row.parameterName
  formData.targetValue = row.targetValue
  formData.maxThreshold = row.maxThreshold
  formData.minThreshold = row.minThreshold
  formData.unit = row.unit
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        await addCraftDetail(formData)
        ElMessage.success('新增成功')
      } else {
        await updateCraftDetail(formData.id!, formData)
        ElMessage.success('修改成功')
      }

      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: CraftDetail) => {
  ElMessageBox.confirm(`确定删除该参数明细吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await deleteCraftDetail(row.id)
        ElMessage.success('删除成功')
        getList()
      } catch (error) {
        console.error('删除失败:', error)
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  getList()
  loadDeviceOptions()
  loadProcessTypeDict()
  loadUnitTypeDict()
})
</script>

<style scoped>
.container {
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-select {
  width: 200px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>

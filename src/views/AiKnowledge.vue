<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>专家知识库管理</span>
          <el-button type="primary" @click="openDialog('add')">新增知识条目</el-button>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="searchForm.keyword"
          placeholder="故障关键词"
          clearable
          class="search-input"
        />
        <el-select
          v-model="searchForm.processType"
          placeholder="所属工序"
          clearable
          class="search-select"
        >
          <el-option
            v-for="pt in processOptions"
            :key="pt.value"
            :label="pt.label"
            :value="pt.value"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="handleTestSearch">检索测试</el-button>
      </div>

      <el-table :data="tableData" stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="kbId" label="ID" width="70" />
        <el-table-column prop="symptomKeyword" label="故障关键词" width="160" />
        <el-table-column prop="processType" label="工序" width="120">
          <template #default="{ row }">{{ getProcessLabel(row.processType) }}</template>
        </el-table-column>
        <el-table-column
          prop="possibleCause"
          label="可能原因"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          prop="solutionSuggestion"
          label="解决方案"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="expertLevel" label="权重" width="80" />
        <el-table-column prop="hitCount" label="引用次数" width="90" />
        <el-table-column prop="source" label="来源" width="110">
          <template #default="{ row }">
            <el-tag :type="row.source === 'MANUAL' ? 'primary' : 'success'">
              {{ row.source === 'MANUAL' ? '手动' : 'AI生成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @change="getList"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="故障关键词" prop="symptomKeyword">
          <el-input v-model="formData.symptomKeyword" placeholder="如：温度波动" />
        </el-form-item>
        <el-form-item label="所属工序" prop="processType">
          <el-select v-model="formData.processType" placeholder="选择工序">
            <el-option
              v-for="pt in processOptions"
              :key="pt.value"
              :label="pt.label"
              :value="pt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="可能原因" prop="possibleCause">
          <el-input
            v-model="formData.possibleCause"
            type="textarea"
            :rows="3"
            placeholder="请输入可能原因"
          />
        </el-form-item>
        <el-form-item label="解决方案" prop="solutionSuggestion">
          <el-input
            v-model="formData.solutionSuggestion"
            type="textarea"
            :rows="3"
            placeholder="请输入解决方案"
          />
        </el-form-item>
        <el-form-item label="权重(1-10)" prop="expertLevel">
          <el-slider v-model="formData.expertLevel" :min="1" :max="10" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 检索测试弹窗 -->
    <el-dialog v-model="testDialogVisible" title="知识库检索测试" width="620px">
      <div class="test-search-form">
        <el-input v-model="testKeyword" placeholder="输入检索关键词" class="test-input" />
        <el-select v-model="testProcessType" placeholder="工序(可选)" clearable>
          <el-option
            v-for="pt in processOptions"
            :key="pt.value"
            :label="pt.label"
            :value="pt.value"
          />
        </el-select>
        <el-button type="primary" :loading="testLoading" @click="doTestSearch">检索</el-button>
      </div>
      <el-table :data="testResults" stripe v-loading="testLoading" style="width: 100%">
        <el-table-column prop="symptomKeyword" label="关键词" width="140" />
        <el-table-column prop="processType" label="工序" width="100" />
        <el-table-column prop="possibleCause" label="原因" min-width="200" show-overflow-tooltip />
        <el-table-column
          prop="solutionSuggestion"
          label="方案"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="expertLevel" label="权重" width="70" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  createAiKnowledge,
  deleteAiKnowledge,
  getAiKnowledgeList,
  searchAiKnowledge,
  updateAiKnowledge,
  type AiKnowledgeForm,
  type AiKnowledgeItem,
  type ProcessType,
} from '@/api/ai'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useDictData } from '@/composables/useDictData'
import { DICT_TYPE } from '@/constants/dict'

const { options: processDictOptions, getLabel: getProcessLabel, load: loadProcessDict } = useDictData(DICT_TYPE.PROCESS_TYPE)

const processOptions = computed(() =>
  processDictOptions.value.map((d) => ({ value: d.dictValue, label: d.dictLabel }))
)

const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const dialogTitle = ref('新增知识条目')
const formRef = ref<FormInstance>()
const tableData = ref<AiKnowledgeItem[]>([])
const editingKbId = ref<number>(0)

const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })
const searchForm = reactive<{ keyword: string; processType?: ProcessType }>({
  keyword: '',
  processType: undefined,
})

const formData = reactive<AiKnowledgeForm>({
  symptomKeyword: '',
  processType: 'FILLING',
  possibleCause: '',
  solutionSuggestion: '',
  expertLevel: 5,
})

const rules = {
  symptomKeyword: [{ required: true, message: '故障关键词不能为空', trigger: 'blur' }],
  processType: [{ required: true, message: '工序不能为空', trigger: 'change' }],
  possibleCause: [{ required: true, message: '可能原因不能为空', trigger: 'blur' }],
  solutionSuggestion: [{ required: true, message: '解决方案不能为空', trigger: 'blur' }],
  expertLevel: [{ required: true, message: '权重不能为空', trigger: 'change' }],
}

const testDialogVisible = ref(false)
const testKeyword = ref('')
const testProcessType = ref<ProcessType | ''>('')
const testLoading = ref(false)
const testResults = ref<AiKnowledgeItem[]>([])

const getList = async () => {
  loading.value = true
  try {
    const res = await getAiKnowledgeList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      processType: searchForm.processType || undefined,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.processType = undefined
  pagination.pageNum = 1
  getList()
}

const openDialog = (type: 'add' | 'edit') => {
  dialogType.value = type
  dialogTitle.value = type === 'add' ? '新增知识条目' : '编辑知识条目'
  if (type === 'add') {
    editingKbId.value = 0
    formData.symptomKeyword = ''
    formData.processType = 'FILLING'
    formData.possibleCause = ''
    formData.solutionSuggestion = ''
    formData.expertLevel = 5
  }
  dialogVisible.value = true
}

const handleEdit = (row: AiKnowledgeItem) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑知识条目'
  editingKbId.value = row.kbId
  formData.symptomKeyword = row.symptomKeyword
  formData.processType = row.processType
  formData.possibleCause = row.possibleCause
  formData.solutionSuggestion = row.solutionSuggestion
  formData.expertLevel = row.expertLevel
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      if (dialogType.value === 'add') {
        await createAiKnowledge(formData)
        ElMessage.success('新增成功')
      } else {
        await updateAiKnowledge(editingKbId.value, formData)
        ElMessage.success('修改成功')
      }
      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleDelete = (row: AiKnowledgeItem) => {
  ElMessageBox.confirm(`确定删除知识条目 "${row.symptomKeyword}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteAiKnowledge(row.kbId)
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

const handleTestSearch = () => {
  testKeyword.value = searchForm.keyword || ''
  testProcessType.value = searchForm.processType || ''
  testResults.value = []
  testDialogVisible.value = true
}

const doTestSearch = async () => {
  if (!testKeyword.value) {
    ElMessage.warning('请输入检索关键词')
    return
  }
  testLoading.value = true
  try {
    const res = await searchAiKnowledge({
      keyword: testKeyword.value,
      processType: (testProcessType.value as ProcessType) || undefined,
    })
    testResults.value = res.data
  } finally {
    testLoading.value = false
  }
}

onMounted(() => {
  loadProcessDict()
  getList()
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
  margin-bottom: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.search-select {
  width: 180px;
}

.pagination {
  margin-top: 12px;
  justify-content: flex-end;
}

.test-search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}

.test-input {
  width: 240px;
}
</style>

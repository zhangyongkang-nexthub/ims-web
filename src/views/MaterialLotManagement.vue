<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>材料入库管理</span>
          <el-button type="primary" @click="openDialog">新增入库</el-button>
        </div>
      </template>

      <div class="search-form">
        <el-select
          v-model="searchForm.itemId"
          placeholder="选择物料"
          clearable
          class="search-select"
        >
          <el-option
            v-for="item in searchItemOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="searchForm.whId"
          placeholder="选择仓库"
          clearable
          class="search-select"
          @change="handleSearchWarehouseChange"
        >
          <el-option
            v-for="wh in warehouseList"
            :key="wh.whId"
            :label="wh.whName"
            :value="wh.whId"
          />
        </el-select>
        <el-select
          v-model="searchForm.locId"
          placeholder="选择库位"
          clearable
          class="search-select"
        >
          <el-option
            v-for="loc in searchLocationOptions"
            :key="loc.locId"
            :label="loc.locCode"
            :value="loc.locId"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="batchNo" label="批次号" width="170" />
        <el-table-column prop="itemName" label="物料名称" width="160" />
        <el-table-column prop="whName" label="仓库" width="140" />
        <el-table-column prop="locCode" label="库位" width="120" />
        <el-table-column prop="currentQty" label="库存数量" width="120" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="productionDate" label="生产/进货日期" width="140" />
        <el-table-column prop="expiryDate" label="有效期" width="120" />
        <el-table-column prop="qcStatusLabel" label="QC状态" width="100" />
        <el-table-column prop="updateTime" label="更新时间" min-width="170" />
      </el-table>

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

    <el-dialog v-model="dialogVisible" title="新增入库" width="560px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="物料" prop="itemId">
          <el-select v-model="formData.itemId" placeholder="请选择物料">
            <el-option
              v-for="item in formItemOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标仓库" prop="whId">
          <el-select
            v-model="formData.whId"
            placeholder="请选择仓库"
            @change="handleFormWarehouseChange"
          >
            <el-option
              v-for="wh in warehouseList"
              :key="wh.whId"
              :label="wh.whName"
              :value="wh.whId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标库位" prop="locId">
          <el-select v-model="formData.locId" placeholder="请选择库位">
            <el-option
              v-for="loc in formLocationOptions"
              :key="loc.locId"
              :label="loc.locCode"
              :value="loc.locId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入库数量" prop="quantity">
          <el-input-number v-model="formData.quantity" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-select v-model="formData.unit" placeholder="请选择单位" clearable>
            <el-option
              v-for="item in unitOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生产/进货日期" prop="productionDate">
          <el-date-picker v-model="formData.productionDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="有效期" prop="expiryDate">
          <el-date-picker v-model="formData.expiryDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="QC状态" prop="qcStatus">
          <el-select v-model="formData.qcStatus" placeholder="请选择QC状态">
            <el-option label="合格" :value="1" />
            <el-option label="待检" :value="2" />
            <el-option label="不合格" :value="3" />
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
import { getLocationList, type Location } from '@/api/location'
import { getMaterialList, type Material } from '@/api/material'
import {
  addMaterialLot,
  getMaterialLotList,
  type MaterialLot,
  type MaterialLotForm,
} from '@/api/materialLot'
import { getWarehouseAll, type Warehouse } from '@/api/warehouse'
import { useDictData } from '@/composables/useDictData'
import { DICT_TYPE } from '@/constants/dict'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

interface SelectOption {
  value: number
  label: string
}

const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const tableData = ref<MaterialLot[]>([])
const materialList = ref<Material[]>([])
const warehouseList = ref<Warehouse[]>([])
const searchLocationOptions = ref<Location[]>([])
const formLocationOptions = ref<Location[]>([])
const { options: unitOptions, load: loadUnitDict } = useDictData(DICT_TYPE.UNIT_TYPE)

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive<{
  itemId?: number
  whId?: string
  locId?: string
}>({
  itemId: undefined,
  whId: undefined,
  locId: undefined,
})

const formData = reactive<MaterialLotForm>({
  itemId: 0,
  itemType: 1,
  whId: '',
  locId: '',
  quantity: 0,
  unit: '',
  productionDate: '',
  expiryDate: '',
  qcStatus: 2,
})

const rules = {
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  whId: [{ required: true, message: '目标仓库不能为空', trigger: 'change' }],
  locId: [{ required: true, message: '目标库位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '入库数量不能为空', trigger: 'blur' }],
}

const searchItemOptions = computed<SelectOption[]>(() => {
  return materialList.value.map((item) => ({ value: item.mid, label: item.mname }))
})

const formItemOptions = computed<SelectOption[]>(() => {
  return materialList.value.map((item) => ({ value: item.mid, label: item.mname }))
})

const getList = async () => {
  loading.value = true
  try {
    const res = await getMaterialLotList({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      itemId: searchForm.itemId,
      itemType: 1,
      whId: searchForm.whId,
      locId: searchForm.locId,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取库存批次明细失败:', error)
  } finally {
    loading.value = false
  }
}

const loadSelectionData = async () => {
  try {
    const [materialRes, warehouseRes] = await Promise.all([
      getMaterialList({ pageSize: 1000 }),
      getWarehouseAll(),
    ])
    materialList.value = materialRes.data.records
    warehouseList.value = warehouseRes.data
  } catch (error) {
    console.error('加载下拉数据失败:', error)
  }
}

const loadLocationsByWarehouse = async (whId: string, target: 'search' | 'form') => {
  try {
    const res = await getLocationList({ whId, pageNum: 1, pageSize: 1000 })
    if (target === 'search') {
      searchLocationOptions.value = res.data.records || []
    } else {
      formLocationOptions.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载库位失败:', error)
    if (target === 'search') {
      searchLocationOptions.value = []
    } else {
      formLocationOptions.value = []
    }
  }
}

const handleSearchWarehouseChange = async (value?: string) => {
  searchForm.locId = undefined
  if (!value) {
    searchLocationOptions.value = []
    return
  }
  await loadLocationsByWarehouse(value, 'search')
}

const handleFormWarehouseChange = async (value: string) => {
  formData.locId = ''
  await loadLocationsByWarehouse(value, 'form')
}

const handleSearch = () => {
  pagination.pageNum = 1
  getList()
}

const handleReset = () => {
  searchForm.itemId = undefined
  searchForm.whId = undefined
  searchForm.locId = undefined
  searchLocationOptions.value = []
  pagination.pageNum = 1
  getList()
}

const openDialog = () => {
  dialogVisible.value = true
  formData.itemId = 0
  formData.itemType = 1
  formData.whId = ''
  formData.locId = ''
  formData.quantity = 0
  formData.unit = ''
  formData.productionDate = ''
  formData.expiryDate = ''
  formData.qcStatus = 2
  formLocationOptions.value = []
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      await addMaterialLot({
        itemId: formData.itemId,
        itemType: 1,
        whId: formData.whId,
        locId: formData.locId,
        quantity: formData.quantity,
        unit: formData.unit,
        productionDate: formData.productionDate,
        expiryDate: formData.expiryDate,
        qcStatus: formData.qcStatus,
      })
      ElMessage.success('入库成功')
      dialogVisible.value = false
      getList()
    } catch (error) {
      console.error('入库失败:', error)
    }
  })
}

onMounted(() => {
  getList()
  loadSelectionData()
  loadUnitDict()
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
  width: 180px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>

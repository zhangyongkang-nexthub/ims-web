<template>
  <div class="container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>材料入库登记</span>
          <el-button @click="goBack">返回材料入库</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" class="register-form">
        <el-form-item label="物料" prop="itemId">
          <el-select v-model="formData.itemId" placeholder="请选择物料" class="form-select">
            <el-option v-for="item in materialOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supId">
          <el-select v-model="formData.supId" placeholder="请选择供应商" clearable class="form-select">
            <el-option v-for="item in supplierOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="到货总数量" prop="totalQuantity">
          <el-input-number v-model="formData.totalQuantity" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-select v-model="formData.unit" placeholder="请选择单位" clearable class="form-select">
            <el-option v-for="item in unitOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产/进货日期" prop="productionDate">
          <el-date-picker v-model="formData.productionDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="有效期" prop="expiryDate">
          <el-date-picker v-model="formData.expiryDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">登记并生成批次号</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="registerResult"
        type="success"
        show-icon
        :closable="false"
        class="result-alert"
        :title="`登记成功，批次号：${registerResult.batchNo}`"
      />

      <div v-if="registerResult" class="result-actions">
        <el-button type="primary" @click="goToPutAway">去入库上架</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { getMaterialList, type Material } from '@/api/material'
import { registerMaterialLot, type MaterialLotRegisterForm, type MaterialLotRegisterInfo } from '@/api/materialLot'
import { getSupplierList, type Supplier } from '@/api/supplier'
import { useDictData } from '@/composables/useDictData'
import { DICT_TYPE } from '@/constants/dict'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

interface SelectOption {
  value: number
  label: string
}

const PENDING_BATCH_STORAGE_KEY = 'material-lot-pending-batches'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const materialList = ref<Material[]>([])
const supplierList = ref<Supplier[]>([])
const registerResult = ref<MaterialLotRegisterInfo | null>(null)
const { options: unitOptions, load: loadUnitDict } = useDictData(DICT_TYPE.UNIT_TYPE)

const formData = reactive<MaterialLotRegisterForm>({
  itemId: 0,
  itemType: 1,
  supId: undefined,
  totalQuantity: 0,
  unit: '',
  productionDate: '',
  expiryDate: '',
})

const rules = {
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  totalQuantity: [{ required: true, message: '到货总数量不能为空', trigger: 'blur' }],
}

const materialOptions = computed<SelectOption[]>(() =>
  materialList.value.map((item) => ({ value: item.mid, label: item.mname })),
)

const supplierOptions = computed<SelectOption[]>(() =>
  supplierList.value.map((item) => ({ value: item.supId, label: item.supName })),
)

const addPendingBatchNo = (batchNo: string) => {
  const raw = localStorage.getItem(PENDING_BATCH_STORAGE_KEY)
  let list: string[] = []
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        list = parsed.filter((item) => typeof item === 'string')
      }
    } catch {
      list = []
    }
  }
  if (!list.includes(batchNo)) {
    list.push(batchNo)
  }
  localStorage.setItem(PENDING_BATCH_STORAGE_KEY, JSON.stringify(list))
}

const loadMaterials = async () => {
  try {
    const res = await getMaterialList({ pageSize: 1000 })
    materialList.value = res.data.records || []
  } catch (error) {
    console.error('加载物料列表失败:', error)
  }
}

const loadSuppliers = async () => {
  try {
    const res = await getSupplierList({ pageSize: 1000 })
    supplierList.value = res.data.records || []
  } catch (error) {
    console.error('加载供应商列表失败:', error)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (formData.totalQuantity <= 0) {
      ElMessage.error('到货总数量必须大于0')
      return
    }

    try {
      submitting.value = true
      const res = await registerMaterialLot({
        itemId: formData.itemId,
        itemType: 1,
        supId: formData.supId,
        totalQuantity: formData.totalQuantity,
        unit: formData.unit || undefined,
        productionDate: formData.productionDate || undefined,
        expiryDate: formData.expiryDate || undefined,
      })
      registerResult.value = res.data
      addPendingBatchNo(res.data.batchNo)
      ElMessage.success(`登记成功，批次号：${res.data.batchNo}`)
    } catch (error) {
      console.error('登记失败:', error)
    } finally {
      submitting.value = false
    }
  })
}

const goBack = () => {
  router.push('/material/lot')
}

const goToPutAway = () => {
  if (!registerResult.value?.batchNo) {
    router.push('/material/lot')
    return
  }
  router.push({ path: '/material/lot', query: { batchNo: registerResult.value.batchNo } })
}

onMounted(() => {
  loadMaterials()
  loadSuppliers()
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

.register-form {
  max-width: 780px;
}

.form-select {
  width: 220px;
}

.result-alert {
  margin-top: 16px;
}

.result-actions {
  margin-top: 12px;
}
</style>

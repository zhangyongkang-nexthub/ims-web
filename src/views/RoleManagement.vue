<template>
  <div class="role-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAdd">新增角色</el-button>
        </div>
      </template>

      <!-- 表格 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleName" label="角色名称" width="200" />
        <el-table-column prop="roleKey" label="角色标识" width="200" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" size="small" @click="handleAssignPerms(row)">
              分配权限
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" />
        </el-form-item>
        <el-form-item label="角色标识" prop="roleKey">
          <el-input v-model="form.roleKey" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 分配权限对话框 -->
    <el-dialog v-model="permDialogVisible" title="分配权限" width="600px">
      <el-tree
        ref="treeRef"
        :data="menuTree"
        :props="treeProps"
        node-key="id"
        show-checkbox
        default-expand-all
      />
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPerms" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getMenuTree, type Menu } from '@/api/menu'
import {
  addRole,
  assignPerms,
  deleteRole,
  getRoleDetail,
  getRoleList,
  updateRole,
  type Role,
  type RoleForm,
} from '@/api/role'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<Role[]>([])
const menuTree = ref<Menu[]>([])

const dialogVisible = ref(false)
const permDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const treeRef = ref()

const form = reactive<RoleForm>({
  roleName: '',
  roleKey: '',
})

const currentRoleId = ref<number>(0)

const treeProps = {
  children: 'children',
  label: 'menuName',
}

const formRules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleKey: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
}

// 加载角色列表
const loadRoleList = async () => {
  loading.value = true
  try {
    const res = await getRoleList()
    tableData.value = res.data
  } catch (error) {
    console.error('加载角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载菜单树
const loadMenuTree = async () => {
  try {
    const res = await getMenuTree()
    menuTree.value = res.data
  } catch (error) {
    console.error('加载菜单树失败:', error)
  }
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Role) => {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
  form.id = row.id
  form.roleName = row.roleName
  form.roleKey = row.roleKey
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: Role) => {
  ElMessageBox.confirm(`确定要删除角色 "${row.roleName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteRole(row.id)
      ElMessage.success('删除成功')
      loadRoleList()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 分配权限
const handleAssignPerms = async (row: Role) => {
  currentRoleId.value = row.id
  permDialogVisible.value = true

  // 加载该角色已有的权限
  try {
    const res = await getRoleDetail(row.id)
    // 等待树渲染完成后设置选中
    setTimeout(() => {
      treeRef.value?.setCheckedKeys(res.data.menuIds)
    }, 100)
  } catch (error) {
    console.error('加载角色权限失败:', error)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateRole(form.id!, form)
          ElMessage.success('更新成功')
        } else {
          await addRole(form)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        loadRoleList()
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 提交权限分配
const handleSubmitPerms = async () => {
  submitLoading.value = true
  try {
    const checkedKeys = treeRef.value?.getCheckedKeys() || []
    const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() || []
    const menuIds = [...checkedKeys, ...halfCheckedKeys]

    await assignPerms({
      roleId: currentRoleId.value,
      menuIds,
    })
    ElMessage.success('权限分配成功')
    permDialogVisible.value = false
  } catch (error) {
    console.error('权限分配失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
  form.id = undefined
  form.roleName = ''
  form.roleKey = ''
}

onMounted(() => {
  loadRoleList()
  loadMenuTree()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

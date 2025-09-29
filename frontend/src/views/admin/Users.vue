<template>
  <div class="admin-users">
    <!-- 页面头部 -->
    <div class="page-header">
      <van-nav-bar
        title="用户管理"
        left-arrow
        @click-left="$router.back()"
      />
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索用户名或邮箱"
        @search="handleSearch"
        @clear="handleClear"
      />
    </div>

    <!-- 用户列表 -->
    <div class="users-list">
      <van-skeleton v-if="loading" title :row="5" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
      
      <div v-else-if="users.length === 0" class="empty-state">
        <van-empty description="暂无用户数据" />
      </div>

      <div v-else>
        <div
          v-for="user in users"
          :key="user.id"
          class="user-card"
          @click="selectUser(user)"
        >
          <div class="user-info">
            <div class="user-avatar">
              <van-icon name="user-circle-o" size="32" color="#1890FF" />
            </div>
            <div class="user-details">
              <div class="user-name">
                {{ user.username }}
                <span v-if="user.role === 'admin'" class="admin-tag">ADMIN</span>
              </div>
              <div class="user-email">{{ user.email }}</div>
              <div class="user-stats">
                <span>AIC: {{ user.aicPoints.toFixed(2) }}</span>
                <span>HH: {{ user.hhPoints.toFixed(2) }}</span>
                <span>余额: ¥{{ user.balance.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <div class="user-actions">
            <van-button
              size="small"
              type="primary"
              @click.stop="addPoints(user)"
            >
              增加积分
            </van-button>
            <van-button
              size="small"
              :type="user.role === 'admin' ? 'warning' : 'success'"
              @click.stop="updateRole(user)"
            >
              {{ user.role === 'admin' ? '取消管理员' : '设为管理员' }}
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="!loading && users.length > 0" class="pagination">
      <van-pagination
        v-model="currentPage"
        :total-items="total"
        :items-per-page="pageSize"
        @change="handlePageChange"
      />
    </div>

    <!-- 增加积分弹窗 -->
    <van-popup v-model:show="showAddPointsDialog" position="center" class="add-points-popup">
      <div class="popup-content">
        <div class="popup-header">
          <h3>增加积分</h3>
          <van-icon name="cross" @click="showAddPointsDialog = false" />
        </div>
        
        <div class="user-info-display">
          <div class="user-name">{{ selectedUser?.username }}</div>
          <div class="user-email">{{ selectedUser?.email }}</div>
        </div>

        <van-form @submit="submitAddPoints">
          <van-field
            v-model="addPointsForm.pointType"
            name="pointType"
            label="积分类型"
            placeholder="请选择积分类型"
            readonly
            is-link
            @click="showPointTypePicker = true"
            :rules="[{ required: true, message: '请选择积分类型' }]"
          />

          <van-field
            v-model="addPointsForm.amount"
            name="amount"
            label="增加数量"
            placeholder="请输入增加数量"
            type="number"
            :rules="[
              { required: true, message: '请输入增加数量' },
              { pattern: /^\d+(\.\d{1,4})?$/, message: '请输入正确的数量格式' }
            ]"
          />

          <van-field
            v-model="addPointsForm.reason"
            name="reason"
            label="操作说明"
            placeholder="请输入操作说明（可选）"
            type="textarea"
            rows="3"
          />

          <div class="popup-actions">
            <van-button @click="showAddPointsDialog = false">取消</van-button>
            <van-button type="primary" native-type="submit" :loading="submitting">确认</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 积分类型选择器 -->
    <van-popup v-model:show="showPointTypePicker" position="bottom">
      <van-picker
        :columns="pointTypeOptions"
        @confirm="onPointTypeConfirm"
        @cancel="showPointTypePicker = false"
      />
    </van-popup>

    <!-- 修改权限弹窗 -->
    <van-popup v-model:show="showUpdateRoleDialog" position="center" class="update-role-popup">
      <div class="popup-content">
        <div class="popup-header">
          <h3>修改用户权限</h3>
          <van-icon name="cross" @click="showUpdateRoleDialog = false" />
        </div>
        
        <div class="user-info-display">
          <div class="user-name">{{ selectedUser?.username }}</div>
          <div class="user-email">{{ selectedUser?.email }}</div>
          <div class="current-role">
            当前权限: 
            <span class="role-badge" :class="selectedUser?.role">
              {{ selectedUser?.role === 'admin' ? '管理员' : '普通用户' }}
            </span>
          </div>
        </div>

        <van-form @submit="submitUpdateRole">
          <van-field
            v-model="updateRoleForm.role"
            name="role"
            label="新权限"
            placeholder="请选择新权限"
            readonly
            is-link
            @click="showRolePicker = true"
            :rules="[{ required: true, message: '请选择新权限' }]"
          />

          <div class="role-warning">
            <van-icon name="warning-o" size="16" color="#FA8C16" />
            <span>修改用户权限将影响其访问权限，请谨慎操作</span>
          </div>

          <div class="popup-actions">
            <van-button @click="showUpdateRoleDialog = false">取消</van-button>
            <van-button type="primary" native-type="submit" :loading="submittingRole">确认</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 权限选择器 -->
    <van-popup v-model:show="showRolePicker" position="bottom">
      <van-picker
        :columns="roleOptions"
        @confirm="onRoleConfirm"
        @cancel="showRolePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { adminApi } from '@/utils/api'
import { showToast, showSuccessToast } from 'vant'

const loading = ref(false)
const users = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')

// 增加积分相关
const showAddPointsDialog = ref(false)
const showPointTypePicker = ref(false)
const selectedUser = ref(null)
const submitting = ref(false)

const addPointsForm = ref({
  pointType: '',
  amount: '',
  reason: ''
})

const pointTypeOptions = [
  { text: 'AIC积分', value: 'AIC' },
  { text: 'HH积分', value: 'HH' }
]

// 修改权限相关
const showUpdateRoleDialog = ref(false)
const showRolePicker = ref(false)
const submittingRole = ref(false)

const updateRoleForm = ref({
  role: ''
})

const roleOptions = [
  { text: '普通用户', value: 'user' },
  { text: '管理员', value: 'admin' }
]

// 加载用户列表
const loadUsers = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }
    
    const data = await adminApi.getUsers(params)
    users.value = data.users
    total.value = data.total
  } catch (error) {
    console.error('Failed to load users:', error)
    showToast('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handleClear = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  loadUsers()
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  loadUsers()
}

// 选择用户
const selectUser = (user) => {
  selectedUser.value = user
  addPoints(user)
}

// 增加积分
const addPoints = (user) => {
  selectedUser.value = user
  addPointsForm.value = {
    pointType: '',
    amount: '',
    reason: ''
  }
  showAddPointsDialog.value = true
}

// 积分类型选择
const onPointTypeConfirm = ({ selectedValues }) => {
  addPointsForm.value.pointType = selectedValues[0]
  showPointTypePicker.value = false
}

// 提交增加积分
const submitAddPoints = async () => {
  try {
    submitting.value = true
    await adminApi.addUserPoints(selectedUser.value.id, {
      pointType: addPointsForm.value.pointType,
      amount: parseFloat(addPointsForm.value.amount),
      reason: addPointsForm.value.reason || '管理员手动增加积分'
    })
    
    showSuccessToast('积分增加成功')
    showAddPointsDialog.value = false
    
    // 重新加载用户列表
    loadUsers()
  } catch (error) {
    console.error('Failed to add points:', error)
    showToast('增加积分失败')
  } finally {
    submitting.value = false
  }
}

// 修改权限
const updateRole = (user) => {
  selectedUser.value = user
  updateRoleForm.value = {
    role: user.role === 'admin' ? 'user' : 'admin' // 默认选择相反的权限
  }
  showUpdateRoleDialog.value = true
}

// 权限选择
const onRoleConfirm = ({ selectedValues }) => {
  updateRoleForm.value.role = selectedValues[0]
  showRolePicker.value = false
}

// 提交修改权限
const submitUpdateRole = async () => {
  try {
    submittingRole.value = true
    await adminApi.updateUserRole(selectedUser.value.id, {
      role: updateRoleForm.value.role
    })
    
    showSuccessToast('权限修改成功')
    showUpdateRoleDialog.value = false
    
    // 重新加载用户列表
    loadUsers()
  } catch (error) {
    console.error('Failed to update role:', error)
    showToast('权限修改失败')
  } finally {
    submittingRole.value = false
  }
}

// 监听搜索关键词变化
watch(searchKeyword, (newVal) => {
  if (newVal === '') {
    loadUsers()
  }
})

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-users {
  min-height: 100vh;
  background-color: var(--background-color);
}

.page-header {
  background: white;
  border-bottom: 1px solid var(--border-color);
}

.search-section {
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.users-list {
  padding: 16px;
}

.empty-state {
  padding: 60px 0;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s;
}

.user-card:active {
  transform: scale(0.98);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(24, 144, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-tag {
  background: linear-gradient(135deg, #722ED1, #1890FF);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: bold;
}

.user-email {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 8px;
}

.user-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-light);
}

.user-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.pagination {
  padding: 16px;
  background: white;
  margin-top: 16px;
}

.add-points-popup {
  border-radius: 12px;
  overflow: hidden;
  max-width: 400px;
  width: 90vw;
}

.popup-content {
  padding: 20px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-color);
}

.user-info-display {
  background: var(--background-color);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 4px;
}

.user-email {
  font-size: 14px;
  color: var(--text-light);
}

.popup-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.popup-actions .van-button {
  flex: 1;
}

/* 修改权限弹窗样式 */
.update-role-popup {
  border-radius: 12px;
  overflow: hidden;
  max-width: 400px;
  width: 90vw;
}

.current-role {
  font-size: 14px;
  color: var(--text-color);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.role-badge.admin {
  background: linear-gradient(135deg, #722ED1, #1890FF);
  color: white;
}

.role-badge.user {
  background: #f0f0f0;
  color: #666;
}

.role-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(250, 140, 22, 0.1);
  border-radius: 8px;
  margin: 16px 0;
  font-size: 14px;
  color: #FA8C16;
}
</style>

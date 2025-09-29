<template>
  <div class="admin-points">
    <!-- 页面头部 -->
    <div class="page-header">
      <van-nav-bar
        title="积分管理"
        left-arrow
        @click-left="$router.back()"
      />
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索用户名或邮箱"
        @search="handleSearch"
        @clear="handleClear"
      />
      <div class="filter-tabs">
        <van-tabs v-model:active="activeTab" @change="handleTabChange">
          <van-tab title="全部用户" name="all" />
          <van-tab title="AIC积分" name="aic" />
          <van-tab title="HH积分" name="hh" />
        </van-tabs>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="users-list">
      <van-skeleton v-if="loading" title :row="4" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
      
      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <van-empty description="暂无用户数据" />
      </div>

      <div v-else>
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="user-card"
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
            </div>
          </div>

          <div class="points-info">
            <div class="point-item">
              <div class="point-label">AIC积分</div>
              <div class="point-value aic">{{ user.aicPoints.toFixed(4) }}</div>
            </div>
            <div class="point-item">
              <div class="point-label">HH积分</div>
              <div class="point-value hh">{{ user.hhPoints.toFixed(4) }}</div>
            </div>
            <div class="point-item">
              <div class="point-label">余额</div>
              <div class="point-value balance">¥{{ user.balance.toFixed(2) }}</div>
            </div>
          </div>

          <div class="user-actions">
            <van-button
              size="small"
              type="primary"
              @click="addPoints(user, 'AIC')"
            >
              +AIC
            </van-button>
            <van-button
              size="small"
              type="success"
              @click="addPoints(user, 'HH')"
            >
              +HH
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="!loading && filteredUsers.length > 0" class="pagination">
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
          <h3>增加{{ addPointsForm.pointType }}积分</h3>
          <van-icon name="cross" @click="showAddPointsDialog = false" />
        </div>
        
        <div class="user-info-display">
          <div class="user-name">{{ selectedUser?.username }}</div>
          <div class="user-email">{{ selectedUser?.email }}</div>
          <div class="current-points">
            当前{{ addPointsForm.pointType }}积分: 
            <span class="point-amount">
              {{ addPointsForm.pointType === 'AIC' ? selectedUser?.aicPoints?.toFixed(4) : selectedUser?.hhPoints?.toFixed(4) }}
            </span>
          </div>
        </div>

        <van-form @submit="submitAddPoints">
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

          <div class="preview-result">
            <div class="preview-label">增加后积分:</div>
            <div class="preview-value">
              {{ calculateNewPoints() }}
            </div>
          </div>

          <div class="popup-actions">
            <van-button @click="showAddPointsDialog = false">取消</van-button>
            <van-button type="primary" native-type="submit" :loading="submitting">确认</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { adminApi } from '@/utils/api'
import { showToast, showSuccessToast } from 'vant'

const loading = ref(false)
const users = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const activeTab = ref('all')

// 增加积分相关
const showAddPointsDialog = ref(false)
const selectedUser = ref(null)
const submitting = ref(false)

const addPointsForm = ref({
  pointType: '',
  amount: '',
  reason: ''
})

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let filtered = users.value

  // 按积分类型筛选
  if (activeTab.value === 'aic') {
    filtered = filtered.filter(user => user.aicPoints > 0)
  } else if (activeTab.value === 'hh') {
    filtered = filtered.filter(user => user.hhPoints > 0)
  }

  return filtered
})

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

// 标签页切换
const handleTabChange = () => {
  // 标签页切换不需要重新加载数据，只是前端筛选
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  loadUsers()
}

// 增加积分
const addPoints = (user, pointType) => {
  selectedUser.value = user
  addPointsForm.value = {
    pointType: pointType,
    amount: '',
    reason: ''
  }
  showAddPointsDialog.value = true
}

// 计算新积分
const calculateNewPoints = () => {
  if (!selectedUser.value || !addPointsForm.value.amount) return '0.0000'
  
  const currentPoints = addPointsForm.value.pointType === 'AIC' 
    ? selectedUser.value.aicPoints 
    : selectedUser.value.hhPoints
  
  const newPoints = Number(currentPoints) + Number(addPointsForm.value.amount || 0)
  return newPoints.toFixed(4)
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
.admin-points {
  min-height: 100vh;
  background-color: var(--background-color);
}

.page-header {
  background: white;
  border-bottom: 1px solid var(--border-color);
}

.filter-section {
  background: white;
  border-bottom: 1px solid var(--border-color);
}

.filter-section .van-search {
  padding: 12px 16px;
}

.filter-tabs {
  padding: 0 16px;
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
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
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
}

.points-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--background-color);
  border-radius: 8px;
}

.point-item {
  text-align: center;
}

.point-label {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 4px;
}

.point-value {
  font-size: 14px;
  font-weight: bold;
}

.point-value.aic {
  color: #FF7F50;
}

.point-value.hh {
  color: #52C41A;
}

.point-value.balance {
  color: #1890FF;
}

.user-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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
  margin-bottom: 8px;
}

.current-points {
  font-size: 14px;
  color: var(--text-color);
}

.point-amount {
  font-weight: bold;
  color: var(--primary-color);
}

.preview-result {
  background: rgba(24, 144, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
  text-align: center;
}

.preview-label {
  font-size: 14px;
  color: var(--text-color);
  margin-bottom: 4px;
}

.preview-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.popup-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.popup-actions .van-button {
  flex: 1;
}
</style>

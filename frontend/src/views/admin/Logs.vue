<template>
  <div class="admin-logs">
    <!-- 页面头部 -->
    <div class="page-header">
      <van-nav-bar
        title="操作日志"
        left-arrow
        @click-left="$router.back()"
      />
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <van-tabs v-model:active="activeTab" @change="handleTabChange">
        <van-tab title="全部操作" name="all" />
        <van-tab title="积分管理" name="points" />
        <van-tab title="用户管理" name="users" />
      </van-tabs>
    </div>

    <!-- 日志列表 -->
    <div class="logs-list">
      <van-skeleton v-if="loading" title :row="3" v-for="i in 5" :key="i" style="margin-bottom:12px;" />
      
      <div v-else-if="logs.length === 0" class="empty-state">
        <van-empty description="暂无操作日志" />
      </div>

      <div v-else>
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          class="log-card"
        >
          <div class="log-header">
            <div class="log-action">
              <van-icon :name="getActionIcon(log.action)" size="16" :color="getActionColor(log.action)" />
              <span class="action-text">{{ getActionText(log.action) }}</span>
            </div>
            <div class="log-time">{{ formatTime(log.createdAt) }}</div>
          </div>

          <div class="log-content">
            <div class="log-user">
              <span class="label">操作人:</span>
              <span class="value">{{ log.adminName }}</span>
            </div>
            
            <div v-if="log.targetUserName" class="log-target">
              <span class="label">目标用户:</span>
              <span class="value">{{ log.targetUserName }}</span>
            </div>

            <div v-if="log.details" class="log-details">
              <!-- 积分操作详情 -->
              <div v-if="log.details.pointType" class="detail-item">
                <span class="label">积分类型:</span>
                <span class="value">{{ log.details.pointType }}</span>
              </div>
              
              <div v-if="log.details.amount" class="detail-item">
                <span class="label">操作数量:</span>
                <span class="value">{{ log.details.amount }}</span>
              </div>
              
              <div v-if="log.details.beforePoints !== undefined" class="detail-item">
                <span class="label">操作前:</span>
                <span class="value">{{ log.details.beforePoints }}</span>
              </div>
              
              <div v-if="log.details.afterPoints !== undefined" class="detail-item">
                <span class="label">操作后:</span>
                <span class="value">{{ log.details.afterPoints }}</span>
              </div>
              
              <!-- 权限修改详情 -->
              <div v-if="log.details.oldRole" class="detail-item">
                <span class="label">原权限:</span>
                <span class="value role-badge" :class="log.details.oldRole">
                  {{ log.details.oldRole === 'admin' ? '管理员' : '普通用户' }}
                </span>
              </div>
              
              <div v-if="log.details.newRole" class="detail-item">
                <span class="label">新权限:</span>
                <span class="value role-badge" :class="log.details.newRole">
                  {{ log.details.newRole === 'admin' ? '管理员' : '普通用户' }}
                </span>
              </div>
              
              <div v-if="log.details.reason" class="detail-item">
                <span class="label">操作说明:</span>
                <span class="value">{{ log.details.reason }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="!loading && filteredLogs.length > 0" class="pagination">
      <van-pagination
        v-model="currentPage"
        :total-items="filteredLogs.length"
        :items-per-page="pageSize"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { adminApi } from '@/utils/api'
import { showToast } from 'vant'

const loading = ref(false)
const logs = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const activeTab = ref('all')

// 过滤后的日志列表
const filteredLogs = computed(() => {
  if (activeTab.value === 'all') {
    return logs.value
  } else if (activeTab.value === 'points') {
    return logs.value.filter(log => log.action === 'add_points')
  } else if (activeTab.value === 'users') {
    return logs.value.filter(log => log.action === 'update_user_role')
  }
  return logs.value
})

// 加载日志列表
const loadLogs = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    const data = await adminApi.getLogs(params)
    logs.value = data.logs
    total.value = data.total
  } catch (error) {
    console.error('Failed to load logs:', error)
    showToast('加载操作日志失败')
  } finally {
    loading.value = false
  }
}

// 标签页切换
const handleTabChange = () => {
  // 标签页切换不需要重新加载数据，只是前端筛选
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  loadLogs()
}

// 获取操作图标
const getActionIcon = (action) => {
  const iconMap = {
    'add_points': 'gem-o',
    'update_user_role': 'user-o',
    'user_management': 'contact',
    'system_config': 'setting-o'
  }
  return iconMap[action] || 'records'
}

// 获取操作颜色
const getActionColor = (action) => {
  const colorMap = {
    'add_points': '#722ED1',
    'update_user_role': '#FA8C16',
    'user_management': '#1890FF',
    'system_config': '#52C41A'
  }
  return colorMap[action] || '#666'
}

// 获取操作文本
const getActionText = (action) => {
  const textMap = {
    'add_points': '增加积分',
    'update_user_role': '修改权限',
    'user_management': '用户管理',
    'system_config': '系统配置'
  }
  return textMap[action] || action
}

// 格式化时间
const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.admin-logs {
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

.logs-list {
  padding: 16px;
}

.empty-state {
  padding: 60px 0;
}

.log-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.log-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-text {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
}

.log-time {
  font-size: 12px;
  color: var(--text-light);
}

.log-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-user,
.log-target {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-details {
  background: var(--background-color);
  padding: 12px;
  border-radius: 8px;
  margin-top: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 12px;
  color: var(--text-light);
  min-width: 60px;
}

.value {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 500;
}

.pagination {
  padding: 16px;
  background: white;
  margin-top: 16px;
}

/* 权限徽章样式 */
.role-badge {
  padding: 2px 6px;
  border-radius: 8px;
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
</style>

<template>
  <div class="admin-dashboard">
    <!-- 页面头部 -->
    <div class="page-header">
      <van-nav-bar
        title="数据看板"
        left-arrow
        @click-left="$router.back()"
      />
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <van-icon name="contact" size="24" color="#1890FF" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.users?.total || 0 }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <van-icon name="user-circle-o" size="24" color="#52C41A" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.users?.active || 0 }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <van-icon name="add-o" size="24" color="#FA8C16" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.users?.todayNew || 0 }}</div>
          <div class="stat-label">今日新增</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <van-icon name="balance-pay" size="24" color="#722ED1" />
        </div>
        <div class="stat-content">
          <div class="stat-value">¥{{ formatNumber(stats.points?.totalBalance || 0) }}</div>
          <div class="stat-label">总余额</div>
        </div>
      </div>
    </div>

    <!-- 积分统计 -->
    <div class="points-section">
      <div class="section-title">积分统计</div>
      <div class="points-grid">
        <div class="point-card">
          <div class="point-header">
            <van-icon name="gem" size="20" color="#FF7F50" />
            <span>AIC积分</span>
          </div>
          <div class="point-value">{{ formatNumber(stats.points?.totalAic || 0) }}</div>
        </div>
        <div class="point-card">
          <div class="point-header">
            <van-icon name="gem-o" size="20" color="#FF7F50" />
            <span>HH积分</span>
          </div>
          <div class="point-value">{{ formatNumber(stats.points?.totalHh || 0) }}</div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <div class="section-title">快捷操作</div>
      <div class="action-grid">
        <div class="action-item" @click="$router.push('/admin/users')">
          <van-icon name="contact" size="24" color="#1890FF" />
          <span>用户管理</span>
        </div>
        <div class="action-item" @click="$router.push('/admin/points')">
          <van-icon name="gem-o" size="24" color="#722ED1" />
          <span>积分管理</span>
        </div>
        <div class="action-item" @click="$router.push('/admin/logs')">
          <van-icon name="records" size="24" color="#52C41A" />
          <span>操作日志</span>
        </div>
        <div class="action-item" @click="refreshData">
          <van-icon name="replay" size="24" color="#FA8C16" />
          <span>刷新数据</span>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <van-skeleton v-if="loading" title :row="8" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/utils/api'
import { showToast } from 'vant'

const loading = ref(false)
const stats = ref({})

// 加载统计数据
const loadStats = async () => {
  try {
    loading.value = true
    const data = await adminApi.getDashboard()
    stats.value = data
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
    showToast('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  loadStats()
  showToast('数据已刷新')
}

// 格式化数字
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toFixed(0)
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: var(--background-color);
}

.page-header {
  background: white;
  border-bottom: 1px solid var(--border-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(24, 144, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-light);
}

.points-section,
.quick-actions {
  margin: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.points-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.point-card {
  background: var(--background-color);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.point-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-color);
}

.point-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--background-color);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-item:active {
  background: rgba(24, 144, 255, 0.1);
}

.action-item span {
  font-size: 12px;
  color: var(--text-color);
}
</style>

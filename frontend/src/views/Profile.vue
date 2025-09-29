<template>
  <div class="profile">
    <!-- 用户信息区 -->
    <div class="user-section gradient-bg">
      <div class="user-info">
        <div class="avatar">
          <van-icon name="user-circle-o" size="48" color="white" />
        </div>
        <div class="user-details">
          <h3 class="username">{{ userStore.userInfo.username }}</h3>
          <p class="user-id">ID: {{ userStore.userInfo.id }}</p>
          <p class="user-role" style="font-size: 12px; color: #ff6b6b;">角色: {{ userStore.userInfo.role }}</p>
        </div>
        <van-icon name="setting-o" size="20" color="white" @click="logout" />
      </div>

      <!-- 快捷余额展示 -->
      <div class="balance-overview" @click="goToWallet">
        <div class="balance-row">
          <div class="balance-item">
            <div class="balance-value">{{ formatPoints(userStore.points.AIC) }}</div>
            <div class="balance-label">AIC积分</div>
          </div>
          <div class="balance-item">
            <div class="balance-value">{{ formatPoints(userStore.points.HH) }}</div>
            <div class="balance-label">HH积分</div>
          </div>
        </div>
        <div class="balance-row">
          <div class="balance-item">
            <div class="balance-value">¥{{ userStore.wallet.balance.toFixed(2) }}</div>
            <div class="balance-label">余额</div>
          </div>
          <div class="balance-item" @click.stop="$router.push('/bind-card')">
            <div class="balance-value">{{ userStore.bankCards.length }}</div>
            <div class="balance-label">银行卡</div>
          </div>
        </div>
      </div>
    </div>


    <!-- 功能菜单 -->
    <div class="menu-sections">
      <!-- 订单中心 -->
      <div class="menu-section">
        <div class="section-header">
          <h4>订单中心</h4>
          <span class="more-link" @click="$router.push('/orders')">查看全部</span>
        </div>
        <div class="menu-grid">
          <div class="menu-item" @click="goToOrders('pending')">
            <van-icon name="pending-payment" size="20" color="#FF7F50" />
            <span>待付款</span>
            <van-badge v-if="pendingPaymentCount > 0" :content="pendingPaymentCount" />
          </div>
          <div class="menu-item" @click="goToOrders('paid')">
            <van-icon name="comment-o" size="20" color="#FF7F50" />
            <span>待评价</span>
            <van-badge v-if="pendingReviewCount > 0" :content="pendingReviewCount" />
          </div>
          <div class="menu-item" @click="goToOrders('completed')">
            <van-icon name="success" size="20" color="#FF7F50" />
            <span>已完成</span>
            <van-badge v-if="completedCount > 0" :content="completedCount" />
          </div>
          <div class="menu-item" @click="goToOrders('buy')">
            <van-icon name="shopping-cart-o" size="20" color="#FF7F50" />
            <span>买入订单</span>
            <van-badge v-if="buyOrdersCount > 0" :content="buyOrdersCount" />
          </div>
          <div class="menu-item" @click="goToOrders('sell')">
            <van-icon name="shop-o" size="20" color="#FF7F50" />
            <span>卖出订单</span>
            <van-badge v-if="sellOrdersCount > 0" :content="sellOrdersCount" />
          </div>
        </div>
      </div>


      <!-- 我的服务 -->
      <div class="menu-section">
        <div class="section-header">
          <h4>我的服务</h4>
        </div>
        <div class="menu-grid">
          <div class="menu-item" @click="showToast('邀请好友功能开发中')">
            <van-icon name="friends-o" size="24" color="#FF7F50" />
            <span>邀请好友</span>
          </div>
          <div class="menu-item" @click="showToast('商家入驻功能开发中')">
            <van-icon name="shop-collect-o" size="24" color="#FF7F50" />
            <span>商家入驻</span>
          </div>
        </div>
      </div>

      <!-- 管理员功能 -->
      <div v-if="userStore.userInfo.role === 'admin'" class="menu-section admin-section">
        <div class="section-header">
          <h4>管理员功能</h4>
          <span class="admin-badge">ADMIN</span>
        </div>
        <div class="menu-grid">
          <div class="menu-item" @click="$router.push('/admin/dashboard')">
            <van-icon name="chart-trending-o" size="24" color="#722ED1" />
            <span>数据看板</span>
          </div>
          <div class="menu-item" @click="$router.push('/admin/users')">
            <van-icon name="friends-o" size="24" color="#722ED1" />
            <span>用户管理</span>
          </div>
          <div class="menu-item" @click="$router.push('/admin/points')">
            <van-icon name="gem-o" size="24" color="#722ED1" />
            <span>积分管理</span>
          </div>
          <div class="menu-item" @click="$router.push('/admin/logs')">
            <van-icon name="records" size="24" color="#722ED1" />
            <span>操作日志</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { marketApi } from '@/utils/api'

const userStore = useUserStore()
const router = useRouter()

// 响应式数据
const myOrders = ref([])

// 计算属性
const pendingPaymentCount = computed(() => {
  return myOrders.value.filter(order => order.status === 'pending').length
})

const pendingReviewCount = computed(() => {
  return myOrders.value.filter(order => order.status === 'paid').length
})

const completedCount = computed(() => {
  return myOrders.value.filter(order => order.status === 'completed').length
})

const buyOrdersCount = computed(() => {
  return myOrders.value.filter(order => order.type === 'buy').length
})

const sellOrdersCount = computed(() => {
  return myOrders.value.filter(order => order.type === 'sell').length
})

// 格式化积分显示
const formatPoints = (points) => {
  if (points === null || points === undefined || isNaN(points)) {
    return '0.0000'
  }
  return Number(points).toFixed(4)
}

// 跳转到钱包页面
const goToWallet = () => {
  router.push('/wallet')
}

// 跳转到订单页面并切换到指定标签页
const goToOrders = (tabName) => {
  router.push({
    path: '/orders',
    query: { tab: tabName }
  })
}

// 加载我的订单数据
const loadMyOrders = async () => {
  try {
    const orders = await marketApi.getUserOrders()
    myOrders.value = orders.map(order => ({
      ...order,
      amount: Number(order.amount),
      remainingAmount: Number(order.remainingAmount),
      unitPrice: Number(order.unitPrice),
      totalPrice: Number(order.totalPrice),
      fee: Number(order.fee),
      createdAt: new Date(order.createdAt).toLocaleString('zh-CN')
    }))
    console.log('Profile页面加载订单数据:', myOrders.value)
  } catch (error) {
    console.error('Failed to load orders in profile:', error)
  }
}

// 页面加载时获取用户信息
onMounted(async () => {
  try {
    // 从localStorage恢复用户信息
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      userStore.userInfo = {
        id: user.id,
        username: user.username,
        phone: user.phone || '',
        avatar: '',
        role: user.role || 'user'
      }
      console.log('Restored user info:', userStore.userInfo)
    }
    
    // 获取最新的用户信息
    await userStore.fetchProfile()
    console.log('Fetched profile:', userStore.userInfo)
    
    // 获取钱包信息
    await userStore.fetchWalletInfo()
    
    // 获取银行卡信息
    await userStore.fetchBankCards()
    
    // 加载订单数据
    await loadMyOrders()
  } catch (error) {
    console.error('Failed to load user profile:', error)
  }
})

// 退出登录
const logout = async () => {
  try {
    await showConfirmDialog({
      title: '确认退出',
      message: '确定要退出登录吗？'
    })
    
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 重置用户状态
    userStore.userInfo = {
      id: '',
      username: '',
      phone: '',
      avatar: '',
      role: 'user'
    }
    userStore.points = { AIC: 0, HH: 0 }
    userStore.wallet = { balance: 0, frozenBalance: 0 }
    userStore.frozenPoints = { AIC: 0, HH: 0 }
    userStore.bankCards = []
    userStore.myOrders = []
    
    showToast('已退出登录')
    
    // 跳转到登录页
    router.push('/login')
  } catch (error) {
    // 用户取消退出
  }
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background-color: var(--background-color);
}

.user-section {
  padding: 20px 16px 24px;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-details {
  flex: 1;
}

.username {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: bold;
}

.user-id {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

.balance-overview {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 24px 20px;
  margin: 0 16px 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.balance-overview:active {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(1px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.balance-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.balance-row:last-child {
  margin-bottom: 0;
}

.balance-item {
  text-align: center;
  flex: 1;
  padding: 12px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.balance-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.balance-value {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.3px;
}

.balance-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}


.menu-sections {
  padding: 0 16px 20px;
}

.menu-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: var(--text-color);
}

.more-link {
  font-size: 12px;
  color: var(--text-light);
  cursor: pointer;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
  position: relative;
}

.menu-item:active {
  background-color: var(--background-color);
}

.menu-item span {
  font-size: 12px;
  color: var(--text-color);
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.van-badge {
  position: absolute;
  top: 4px;
  right: 8px;
}

/* 管理员区域样式 */
.admin-section {
  border: 2px solid #722ED1;
  background: linear-gradient(135deg, #f9f0ff 0%, #e6f7ff 100%);
}

.admin-badge {
  background: linear-gradient(135deg, #722ED1, #1890FF);
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
}

.admin-item {
  background: rgba(114, 46, 209, 0.05);
  border: 1px solid rgba(114, 46, 209, 0.1);
}

.admin-item:active {
  background: rgba(114, 46, 209, 0.1);
}

/* 响应式调整 */
@media (max-width: 375px) {
  .menu-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .menu-item span {
    font-size: 11px;
  }
}
</style>
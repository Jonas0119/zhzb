<template>
  <div class="completed-orders">
    <div class="orders-list">
      <van-skeleton v-if="loading" title :row="4" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
      
      <div v-else-if="orders.length === 0" class="empty-state">
        <van-empty description="暂无已完成订单">
          <van-button type="primary" @click="$router.push('/market')">去购买</van-button>
        </van-empty>
      </div>

      <div
        v-else
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        @click="viewOrderDetail(order)"
      >
        <div class="order-header">
          <span class="order-type">{{ getOrderTypeText(order.type) }}</span>
          <span class="status-completed">已完成</span>
        </div>

        <div class="order-content">
          <div class="order-info">
            <div class="info-row">
              <span class="label">积分类型:</span>
              <span class="value">{{ order.pointType }}积分</span>
            </div>
            <div class="info-row">
              <span class="label">数量:</span>
              <span class="value">{{ order.amount.toFixed(4) }}</span>
            </div>
            <div class="info-row">
              <span class="label">单价:</span>
              <span class="value">¥{{ order.unitPrice.toFixed(2) }}</span>
            </div>
            <div class="info-row">
              <span class="label">总价:</span>
              <span class="value amount-text">¥{{ order.totalPrice.toFixed(2) }}</span>
            </div>
            <div class="info-row">
              <span class="label">卖家:</span>
              <span class="value">{{ order.sellerName || '未知' }}</span>
            </div>
            <div v-if="order.review" class="info-row">
              <span class="label">评价:</span>
              <div class="review-info">
                <van-rate v-model="order.review.rating" readonly size="12" />
                <span class="review-comment">{{ order.review.comment }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <span class="order-time">{{ formatTime(order.completedAt || order.createdAt) }}</span>
          <div class="order-actions">
            <van-button
              size="small"
              type="default"
              @click.stop="viewOrderDetail(order)"
            >
              查看详情
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'

const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const orders = ref([])

// 方法
const getOrderTypeText = (type) => {
  return type === 'buy' ? '购买' : '出售'
}

const formatTime = (timeStr) => {
  return timeStr.split(' ')[0]
}

const viewOrderDetail = (order) => {
  // 跳转到订单详情页面
  console.log('View order detail:', order)
  showToast('查看订单详情')
}

const loadOrders = async () => {
  try {
    loading.value = true
    // 模拟数据，实际应该调用API
    orders.value = userStore.myOrders.filter(order => order.status === 'completed')
  } catch (error) {
    showToast('加载订单失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.completed-orders {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 16px;
}

.orders-list {
  max-width: 100%;
}

.order-card {
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.order-type {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 500;
}

.status-completed {
  font-size: 12px;
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 8px;
  border-radius: 4px;
}

.order-content {
  margin-bottom: 12px;
}

.order-info {
  display: grid;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: var(--text-light);
  font-size: 14px;
}

.value {
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
}

.amount-text {
  color: #ff6b6b;
  font-weight: 600;
}

.review-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-comment {
  font-size: 12px;
  color: var(--text-light);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.order-time {
  font-size: 12px;
  color: var(--text-light);
}

.order-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  padding: 60px 0;
}
</style>

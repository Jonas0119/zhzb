<template>
  <div class="pending-payment">
    <div class="orders-list">
      <van-skeleton v-if="loading" title :row="4" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
      
      <div v-else-if="orders.length === 0" class="empty-state">
        <van-empty description="暂无待付款订单">
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
          <span class="status-pending">待付款</span>
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
              <span class="label">手续费:</span>
              <span class="value">¥{{ order.fee.toFixed(2) }}</span>
            </div>
            <div class="info-row">
              <span class="label">实付金额:</span>
              <span class="value amount-text">¥{{ (order.totalPrice + order.fee).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <span class="order-time">{{ formatTime(order.createdAt) }}</span>
          <div class="order-actions">
            <van-button
              size="small"
              type="default"
              @click.stop="cancelOrder(order)"
            >
              取消订单
            </van-button>
            <van-button
              size="small"
              type="primary"
              @click.stop="payOrder(order)"
            >
              立即支付
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付确认弹窗 -->
    <van-dialog
      v-model:show="showPayDialog"
      title="确认支付"
      @confirm="confirmPay"
      @cancel="showPayDialog = false"
    >
      <div class="pay-content">
        <p>订单金额: ¥{{ selectedOrder?.totalPrice?.toFixed(2) }}</p>
        <p>手续费: ¥{{ selectedOrder?.fee?.toFixed(2) }}</p>
        <p><strong>实付金额: ¥{{ ((selectedOrder?.totalPrice || 0) + (selectedOrder?.fee || 0)).toFixed(2) }}</strong></p>
        <p>钱包余额: ¥{{ userStore.wallet.balance.toFixed(2) }}</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'

const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const orders = ref([])
const showPayDialog = ref(false)
const selectedOrder = ref(null)

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
}

const cancelOrder = async (order) => {
  try {
    await showConfirmDialog({
      title: '确认取消',
      message: '确定要取消这个订单吗？'
    })
    
    // 调用取消订单API
    showSuccessToast('订单已取消')
    loadOrders()
  } catch (error) {
    // 用户取消操作
  }
}

const payOrder = (order) => {
  selectedOrder.value = order
  showPayDialog.value = true
}

const confirmPay = async () => {
  try {
    // 调用支付API
    showSuccessToast('支付成功')
    showPayDialog.value = false
    loadOrders()
  } catch (error) {
    showToast('支付失败，请重试')
  }
}

const loadOrders = async () => {
  try {
    loading.value = true
    // 模拟数据，实际应该调用API
    orders.value = userStore.myOrders.filter(order => order.status === 'pending')
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
.pending-payment {
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

.status-pending {
  font-size: 12px;
  color: #ff6b6b;
  background: #fff2f0;
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

.pay-content {
  padding: 16px;
  line-height: 2;
}

.pay-content p {
  margin: 0;
  display: flex;
  justify-content: space-between;
}
</style>

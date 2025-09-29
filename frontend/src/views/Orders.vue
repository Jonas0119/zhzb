<template>
  <div class="orders">
    <!-- Tab标签栏 -->
    <van-tabs v-model:active="activeTab">
      <van-tab title="全部订单" name="all">
        <div class="orders-list">
          <van-skeleton v-if="loading" title :row="4" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
          <div
            v-else
            v-for="order in allOrders"
            :key="order.id"
            class="order-card"
            @click="viewOrderDetail(order)"
          >
            <div class="order-header">
              <span class="order-type">{{ getOrderTypeText(order.type) }}</span>
              <span :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span>
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
              </div>
            </div>

            <div class="order-footer">
              <span class="order-time">{{ order.createdAt }}</span>
              <div class="order-actions">
                <van-button
                  v-if="order.status === 'active' && order.type === 'sell'"
                  size="small"
                  @click.stop="cancelOrder(order)"
                >
                  取消订单
                </van-button>
                <van-button
                  v-if="order.status === 'paid'"
                  size="small"
                  type="primary"
                  @click.stop="reviewOrder(order)"
                >
                  立即评价
                </van-button>
                <van-button
                  v-if="order.status === 'completed'"
                  size="small"
                  type="primary"
                  @click.stop="viewOrderDetail(order)"
                >
                  查看详情
                </van-button>
              </div>
            </div>
          </div>

          <div v-if="!loading && allOrders.length === 0" class="empty-state">
            <van-empty description="暂无订单">
              <van-button type="primary" @click="$router.push('/market')">
                去交易
              </van-button>
            </van-empty>
          </div>
        </div>
      </van-tab>

      <van-tab title="待付款" name="pending">
        <div class="orders-list">
          <van-skeleton v-if="loading" title :row="4" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
          <div
            v-else
            v-for="order in pendingOrders"
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
              </div>
            </div>

            <div class="order-footer">
              <span class="order-time">{{ order.createdAt }}</span>
              <div class="order-actions">
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

          <div v-if="!loading && pendingOrders.length === 0" class="empty-state">
            <van-empty description="暂无待付款订单">
              <van-button type="primary" @click="$router.push('/market')">去购买</van-button>
            </van-empty>
          </div>
        </div>
      </van-tab>

      <van-tab title="待评价" name="paid">
        <div class="orders-list">
          <van-skeleton v-if="loading" title :row="4" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
          <div
            v-else
            v-for="order in paidOrders"
            :key="order.id"
            class="order-card"
            @click="viewOrderDetail(order)"
          >
            <div class="order-header">
              <span class="order-type">{{ getOrderTypeText(order.type) }}</span>
              <span class="status-paid">待评价</span>
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
              </div>
            </div>

            <div class="order-footer">
              <span class="order-time">{{ order.createdAt }}</span>
              <div class="order-actions">
                <van-button
                  size="small"
                  type="primary"
                  @click.stop="reviewOrder(order)"
                >
                  立即评价
                </van-button>
              </div>
            </div>
          </div>

          <div v-if="!loading && paidOrders.length === 0" class="empty-state">
            <van-empty description="暂无待评价订单">
              <van-button type="primary" @click="$router.push('/market')">去购买</van-button>
            </van-empty>
          </div>
        </div>
      </van-tab>

      <van-tab title="已完成" name="completed">
        <div class="orders-list">
          <van-skeleton v-if="loading" title :row="4" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
          <div
            v-else
            v-for="order in completedOrders"
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
              </div>
            </div>

            <div class="order-footer">
              <span class="order-time">{{ order.createdAt }}</span>
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

          <div v-if="!loading && completedOrders.length === 0" class="empty-state">
            <van-empty description="暂无已完成订单">
              <van-button type="primary" @click="$router.push('/market')">去购买</van-button>
            </van-empty>
          </div>
        </div>
      </van-tab>

      <van-tab title="买入订单" name="buy">
        <div class="orders-list">
          <van-skeleton v-if="loading" title :row="4" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
          <div
            v-else
            v-for="order in buyOrders"
            :key="order.id"
            class="order-card"
            @click="viewOrderDetail(order)"
          >
            <div class="order-header">
              <span class="order-type">买入订单</span>
              <span :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span>
            </div>

            <div class="order-content">
              <div class="order-info">
                <div class="info-row">
                  <span class="label">积分类型:</span>
                  <span class="value">{{ order.pointType }}积分</span>
                </div>
                <div class="info-row">
                  <span class="label">购买数量:</span>
                  <span class="value">{{ order.amount.toFixed(4) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">成交价格:</span>
                  <span class="value">¥{{ order.unitPrice.toFixed(2) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">支付金额:</span>
                  <span class="value amount-text">¥{{ order.totalPrice.toFixed(2) }}</span>
                </div>
                <div v-if="order.fee" class="info-row">
                  <span class="label">手续费:</span>
                  <span class="value">¥{{ order.fee.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="order-footer">
              <span class="order-time">{{ order.createdAt }}</span>
            </div>
          </div>

          <div v-if="!loading && buyOrders.length === 0" class="empty-state">
            <van-empty description="暂无买入订单" />
          </div>
        </div>
      </van-tab>

      <van-tab title="卖出订单" name="sell">
        <div class="orders-list">
          <van-skeleton v-if="loading" title :row="4" v-for="i in 3" :key="i" style="margin-bottom:12px;" />
          <div
            v-else
            v-for="order in sellOrders"
            :key="order.id"
            class="order-card"
            @click="viewOrderDetail(order)"
          >
            <div class="order-header">
              <span class="order-type">卖出订单</span>
              <span :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span>
            </div>

            <div class="order-content">
              <div class="order-info">
                <div class="info-row">
                  <span class="label">积分类型:</span>
                  <span class="value">{{ order.pointType }}积分</span>
                </div>
                <div class="info-row">
                  <span class="label">发布数量:</span>
                  <span class="value">{{ order.amount.toFixed(4) }}</span>
                </div>
                <div v-if="order.remainingAmount !== undefined" class="info-row">
                  <span class="label">剩余数量:</span>
                  <span class="value">{{ order.remainingAmount.toFixed(4) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">单价:</span>
                  <span class="value">¥{{ order.unitPrice.toFixed(2) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">总价:</span>
                  <span class="value amount-text">¥{{ order.totalPrice.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="order-footer">
              <span class="order-time">{{ order.createdAt }}</span>
              <div class="order-actions">
                <van-button
                  v-if="order.status === 'active'"
                  size="small"
                  @click.stop="cancelOrder(order)"
                >
                  取消订单
                </van-button>
              </div>
            </div>
          </div>

          <div v-if="!loading && sellOrders.length === 0" class="empty-state">
            <van-empty description="暂无卖出订单">
              <van-button type="primary" @click="$router.push('/sell')">
                去发布
              </van-button>
            </van-empty>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useMarketStore } from '@/store/market'
import { marketApi } from '@/utils/api'
import { showToast, showSuccessToast, showConfirmDialog, showDialog } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const marketStore = useMarketStore()

// 响应式数据
const activeTab = ref('all')
const loading = ref(false)
const myOrders = ref([])

// 计算属性
const allOrders = computed(() => {
  console.log('计算 allOrders:', myOrders.value)
  return myOrders.value
})
const buyOrders = computed(() => {
  const result = myOrders.value.filter(order => order.type === 'buy')
  console.log('计算 buyOrders:', result)
  return result
})
const sellOrders = computed(() => {
  const result = myOrders.value.filter(order => order.type === 'sell')
  console.log('计算 sellOrders:', result)
  return result
})
const pendingOrders = computed(() => {
  const result = myOrders.value.filter(order => order.status === 'pending')
  console.log('计算 pendingOrders:', result)
  return result
})
const paidOrders = computed(() => {
  const result = myOrders.value.filter(order => order.status === 'paid')
  console.log('计算 paidOrders:', result)
  return result
})
const completedOrders = computed(() => {
  const result = myOrders.value.filter(order => order.status === 'completed')
  console.log('计算 completedOrders:', result)
  return result
})

// 加载我的订单
const loadMyOrders = async () => {
  try {
    loading.value = true
    const orders = await marketApi.getUserOrders()
    console.log('原始订单数据:', orders)
    myOrders.value = orders.map(order => ({
      ...order,
      amount: Number(order.amount),
      remainingAmount: Number(order.remainingAmount),
      unitPrice: Number(order.unitPrice),
      totalPrice: Number(order.totalPrice),
      fee: Number(order.fee),
      createdAt: new Date(order.createdAt).toLocaleString('zh-CN')
    }))
    console.log('处理后的订单数据:', myOrders.value)
    
    // 等待DOM更新
    await nextTick()
    
    console.log('全部订单数量:', allOrders.value.length)
    console.log('待评价订单数量:', paidOrders.value.length)
    console.log('待评价订单:', paidOrders.value)
  } catch (error) {
    console.error('Failed to load orders:', error)
    showToast('加载订单失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMyOrders()
  
  // 根据URL参数设置活动标签页
  if (route.query.tab) {
    activeTab.value = route.query.tab
  }
})

// 监听路由参数变化
watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    activeTab.value = newTab
  }
})

// 方法
const getOrderTypeText = (type) => {
  return type === 'buy' ? '买入订单' : '卖出订单'
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待付款',
    'paid': '待评价',
    'completed': '已完成',
    'cancelled': '已取消',
    'active': '进行中'
  }
  return statusMap[status] || status
}

const getStatusClass = (status) => {
  const classMap = {
    'pending': 'status-tag status-tag--pending',
    'paid': 'status-tag status-tag--paid',
    'completed': 'status-tag status-tag--completed',
    'cancelled': 'status-tag status-tag--cancelled',
    'active': 'status-tag status-tag--active'
  }
  return classMap[status] || 'status-tag'
}

const cancelOrder = async (order) => {
  try {
    await showConfirmDialog({
      title: '确认取消',
      message: '确定要取消这个订单吗？'
    })

    if (order.type === 'sell') {
      // 取消卖单
      await marketApi.cancelOrder(order.id)
      // 重新加载订单列表
      await loadMyOrders()
      showSuccessToast('订单已取消')
    } else {
      // 取消买单 (暂时不支持，因为是即时交易)
      showToast('买入订单无法取消')
    }
  } catch (error) {
    if (error.message !== 'cancel') {
      console.error('Failed to cancel order:', error)
      showToast('取消订单失败')
    }
  }
}

const viewOrderDetail = (order) => {
  // 跳转到订单详情页面
  router.push(`/order/${order.id}`)
}

const payOrder = (order) => {
  // 跳转到支付页面或显示支付弹窗
  console.log('Pay order:', order)
  showToast('支付功能开发中')
}

const reviewOrder = async (order) => {
  try {
    const { rating, comment } = await showReviewDialog()
    if (rating) {
      await marketApi.reviewOrder(order.id, { rating, comment })
      showSuccessToast('评价成功')
      loadMyOrders() // 重新加载订单列表
    }
  } catch (error) {
    if (error.message !== 'cancel') {
      showToast('评价失败，请重试')
    }
  }
}

// 评价弹窗
const showReviewDialog = () => {
  return new Promise((resolve, reject) => {
    const dialog = showDialog({
      title: '订单评价',
      message: '请为本次交易进行评价',
      showCancelButton: true,
      confirmButtonText: '提交评价',
      cancelButtonText: '取消'
    })
    
    // 这里需要实现一个更复杂的评价界面
    // 暂时使用简单的评分
    const rating = 5 // 默认5星
    const comment = '交易顺利' // 默认评价
    
    resolve({ rating, comment })
  })
}
</script>

<style scoped>
.orders {
  min-height: 100vh;
  background-color: var(--background-color);
}

.van-tabs {
  --van-tabs-line-height: 44px;
  --van-tab-active-text-color: var(--primary-color);
  --van-tabs-bottom-bar-color: var(--primary-color);
}

.orders-list {
  padding: 12px 16px;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
}

.order-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.order-card:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.order-type {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
}

.status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
}

.status-tag--active {
  background-color: var(--success-color);
}

.status-tag--completed {
  background-color: #999;
}

.status-tag--cancelled {
  background-color: #FF4D4F;
}

.status-tag--pending {
  background-color: var(--primary-color);
}

.status-tag--paid {
  background-color: #f39c12;
}

.status-pending {
  font-size: 12px;
  color: #ff6b6b;
  background: #fff2f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-paid {
  font-size: 12px;
  color: #ff9500;
  background: #fff7e6;
  padding: 2px 8px;
  border-radius: 4px;
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

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-light);
  border-top: 1px solid var(--border-color);
  padding-top: 8px;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  padding: 60px 0;
}
</style>
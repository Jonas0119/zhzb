<template>
  <div class="order-detail">
    <van-nav-bar
      title="订单详情"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div v-if="loading" class="loading-container">
      <van-skeleton title :row="6" />
    </div>

    <div v-else-if="order" class="order-content">
      <!-- 订单状态 -->
      <div class="status-section">
        <div class="status-icon">
          <van-icon :name="getStatusIcon(order.status)" size="48" :color="getStatusColor(order.status)" />
        </div>
        <div class="status-text">{{ getStatusText(order.status) }}</div>
        <div class="status-desc">{{ getStatusDesc(order.status) }}</div>
      </div>

      <!-- 订单信息 -->
      <div class="info-section">
        <h3>订单信息</h3>
        <div class="info-card">
          <div class="info-row">
            <span class="label">订单号:</span>
            <span class="value">{{ order.id }}</span>
          </div>
          <div class="info-row">
            <span class="label">订单类型:</span>
            <span class="value">{{ getOrderTypeText(order.type) }}</span>
          </div>
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
          <div v-if="order.fee" class="info-row">
            <span class="label">手续费:</span>
            <span class="value">¥{{ order.fee.toFixed(2) }}</span>
          </div>
          <div class="info-row">
            <span class="label">实付金额:</span>
            <span class="value amount-text">¥{{ ((order.totalPrice || 0) + (order.fee || 0)).toFixed(2) }}</span>
          </div>
          <div class="info-row">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDateTime(order.createdAt) }}</span>
          </div>
          <div v-if="order.paidAt" class="info-row">
            <span class="label">支付时间:</span>
            <span class="value">{{ formatDateTime(order.paidAt) }}</span>
          </div>
          <div v-if="order.completedAt" class="info-row">
            <span class="label">完成时间:</span>
            <span class="value">{{ formatDateTime(order.completedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 交易方信息 -->
      <div class="info-section">
        <h3>交易方信息</h3>
        <div class="info-card">
          <div class="info-row">
            <span class="label">卖家:</span>
            <span class="value">{{ order.sellerName || '未知' }}</span>
          </div>
          <div class="info-row">
            <span class="label">买家:</span>
            <span class="value">{{ order.buyerName || '未知' }}</span>
          </div>
        </div>
      </div>

      <!-- 评价信息 -->
      <div v-if="order.review" class="info-section">
        <h3>评价信息</h3>
        <div class="info-card">
          <div class="review-rating">
            <span class="label">评分:</span>
            <van-rate v-model="order.review.rating" readonly />
          </div>
          <div class="review-comment">
            <span class="label">评价内容:</span>
            <div class="comment-text">{{ order.review.comment }}</div>
          </div>
          <div class="info-row">
            <span class="label">评价时间:</span>
            <span class="value">{{ formatDateTime(order.review.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <van-button
          v-if="order.status === 'pending'"
          type="primary"
          size="large"
          @click="payOrder"
        >
          立即支付
        </van-button>
        <van-button
          v-if="order.status === 'pending'"
          type="default"
          size="large"
          @click="cancelOrder"
        >
          取消订单
        </van-button>
        <van-button
          v-if="order.status === 'paid'"
          type="primary"
          size="large"
          @click="reviewOrder"
        >
          立即评价
        </van-button>
        <van-button
          v-if="order.status === 'completed'"
          type="default"
          size="large"
          @click="$router.back()"
        >
          返回
        </van-button>
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
        <p>订单金额: ¥{{ order?.totalPrice?.toFixed(2) }}</p>
        <p>手续费: ¥{{ order?.fee?.toFixed(2) }}</p>
        <p><strong>实付金额: ¥{{ ((order?.totalPrice || 0) + (order?.fee || 0)).toFixed(2) }}</strong></p>
        <p>钱包余额: ¥{{ userStore.wallet.balance.toFixed(2) }}</p>
      </div>
    </van-dialog>

    <!-- 评价弹窗 -->
    <van-dialog
      v-model:show="showReviewDialog"
      title="订单评价"
      @confirm="submitReview"
      @cancel="showReviewDialog = false"
    >
      <div class="review-content">
        <div class="review-rating">
          <span>评分:</span>
          <van-rate v-model="reviewForm.rating" />
        </div>
        <van-field
          v-model="reviewForm.comment"
          type="textarea"
          placeholder="请输入评价内容"
          rows="3"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const order = ref(null)
const showPayDialog = ref(false)
const showReviewDialog = ref(false)
const reviewForm = ref({
  rating: 5,
  comment: ''
})

// 方法
const getOrderTypeText = (type) => {
  return type === 'buy' ? '购买' : '出售'
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待付款',
    'paid': '待评价',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知状态'
}

const getStatusIcon = (status) => {
  const iconMap = {
    'pending': 'clock-o',
    'paid': 'star-o',
    'completed': 'success',
    'cancelled': 'close'
  }
  return iconMap[status] || 'question-o'
}

const getStatusColor = (status) => {
  const colorMap = {
    'pending': '#ff6b6b',
    'paid': '#ff9500',
    'completed': '#52c41a',
    'cancelled': '#999'
  }
  return colorMap[status] || '#999'
}

const getStatusDesc = (status) => {
  const descMap = {
    'pending': '请及时完成支付',
    'paid': '交易已完成，请对本次交易进行评价',
    'completed': '订单已完成',
    'cancelled': '订单已取消'
  }
  return descMap[status] || ''
}

const formatDateTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').split('.')[0]
}

const payOrder = () => {
  showPayDialog.value = true
}

const confirmPay = async () => {
  try {
    // 调用支付API
    showSuccessToast('支付成功')
    showPayDialog.value = false
    loadOrderDetail()
  } catch (error) {
    showToast('支付失败，请重试')
  }
}

const cancelOrder = async () => {
  try {
    await showConfirmDialog({
      title: '确认取消',
      message: '确定要取消这个订单吗？'
    })
    
    // 调用取消订单API
    showSuccessToast('订单已取消')
    loadOrderDetail()
  } catch (error) {
    // 用户取消操作
  }
}

const reviewOrder = () => {
  reviewForm.value = {
    rating: 5,
    comment: ''
  }
  showReviewDialog.value = true
}

const submitReview = async () => {
  try {
    // 调用评价API
    const { marketApi } = await import('@/utils/api')
    await marketApi.reviewOrder(order.value.id, {
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment
    })
    showSuccessToast('评价成功')
    showReviewDialog.value = false
    loadOrderDetail()
  } catch (error) {
    showToast('评价失败，请重试')
  }
}

const loadOrderDetail = async () => {
  try {
    loading.value = true
    const orderId = route.params.id
    console.log('加载订单详情，订单ID:', orderId)
    
    // 先尝试从API获取订单详情
    try {
      const { marketApi } = await import('@/utils/api')
      const orderDetail = await marketApi.getOrderDetail(orderId)
      console.log('从API获取的订单详情:', orderDetail)
      
      // 处理订单数据格式
      order.value = {
        ...orderDetail,
        amount: Number(orderDetail.amount),
        remainingAmount: Number(orderDetail.remainingAmount),
        unitPrice: Number(orderDetail.unitPrice),
        totalPrice: Number(orderDetail.totalPrice),
        fee: Number(orderDetail.fee),
        createdAt: new Date(orderDetail.createdAt).toLocaleString('zh-CN'),
        paidAt: orderDetail.paidAt ? new Date(orderDetail.paidAt).toLocaleString('zh-CN') : null,
        completedAt: orderDetail.completedAt ? new Date(orderDetail.completedAt).toLocaleString('zh-CN') : null
      }
    } catch (apiError) {
      console.log('API获取失败，尝试从本地数据查找:', apiError)
      
      // 如果API失败，尝试从本地数据查找
      order.value = userStore.myOrders.find(o => o.id == orderId)
      
      if (!order.value) {
        showToast('订单不存在')
        router.back()
        return
      }
    }
    
    console.log('最终订单数据:', order.value)
  } catch (error) {
    console.error('加载订单详情失败:', error)
    showToast('加载订单详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.order-detail {
  min-height: 100vh;
  background-color: var(--background-color);
}

.loading-container {
  padding: 16px;
}

.order-content {
  padding: 16px;
}

.status-section {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
}

.status-icon {
  margin-bottom: 16px;
}

.status-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.status-desc {
  font-size: 14px;
  color: var(--text-light);
}

.info-section {
  margin-bottom: 16px;
}

.info-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  padding-left: 4px;
}

.info-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
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

.review-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-comment {
  padding: 8px 0;
}

.comment-text {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
}

.action-section {
  padding: 16px 0;
  display: flex;
  gap: 12px;
}

.action-section .van-button {
  flex: 1;
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

.review-content {
  padding: 16px;
}

.review-content .review-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  border-bottom: none;
  padding: 0;
}
</style>

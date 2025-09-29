<template>
  <div class="buy">
    <div v-if="!order" class="error-state">
      <van-empty description="订单不存在或已下架" />
    </div>

    <div v-else class="buy-container">
      <!-- 订单信息 -->
      <div class="order-info card">
        <h3>订单信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">积分类型:</span>
            <span class="value">{{ order.pointType }}积分</span>
          </div>
          <div class="info-item">
            <span class="label">单价:</span>
            <span class="value amount-text">¥{{ order.unitPrice.toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="label">可购买数量:</span>
            <span class="value">{{ order.remainingAmount.toFixed(4) }}</span>
          </div>
          <div class="info-item">
            <span class="label">卖家:</span>
            <span class="value">{{ order.sellerName }}</span>
          </div>
        </div>
      </div>

      <!-- 购买表单 -->
      <div class="buy-form card">
        <h3>购买信息</h3>
        <van-form @submit="onSubmit">
          <van-field
            v-model="formData.amount"
            name="amount"
            label="购买数量"
            placeholder="请输入购买数量"
            type="text"
            @input="onAmountChange"
            @keydown="onKeyDown"
            @focus="onFocus"
            ref="amountInput"
            :rules="[
              { required: true, message: '请输入购买数量' },
              { validator: validateAmount, message: '购买数量不能超过可购买数量' }
            ]"
          />

          <van-field
            name="totalCost"
            label="需要金额"
            readonly
            v-model="totalCostDisplay"
          />

          <van-field
            name="fee"
            label="手续费"
            readonly
            v-model="feeDisplay"
          />

          <van-field
            name="finalCost"
            label="实付金额"
            readonly
            v-model="finalCostDisplay"
          />

          <div class="balance-check">
            <div class="balance-item">
              <span>钱包余额:</span>
              <span class="amount-text">¥{{ userStore.wallet.balance.toFixed(2) }}</span>
            </div>
            <div v-if="finalCost > userStore.wallet.balance" class="insufficient-balance">
              <van-icon name="warning" color="#FF4D4F" />
              <span>余额不足</span>
              <van-button type="primary" size="mini" @click="$router.push('/recharge')">
                去充值
              </van-button>
            </div>
          </div>

          <div class="submit-section">
            <van-button
              type="primary"
              size="large"
              native-type="submit"
              :disabled="!isFormValid"
              :loading="submitting"
            >
              确认购买
            </van-button>
          </div>
        </van-form>
      </div>
    </div>

    <!-- 确认购买弹窗 -->
    <van-dialog
      v-model:show="showConfirmDialog"
      title="确认购买"
      show-cancel-button
      confirm-button-text="确认"
      cancel-button-text="取消"
      @confirm="confirmBuy"
      @cancel="cancelBuy"
    >
      <div class="confirm-content">
        <p>购买数量: {{ formData.amount }}</p>
        <p>应付金额: ¥{{ totalCost.toFixed(2) }}</p>
        <p>手续费: ¥{{ fee.toFixed(2) }}</p>
        <p><strong>实付金额: ¥{{ finalCost.toFixed(2) }}</strong></p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useMarketStore } from '@/store/market'
import { showToast, showSuccessToast } from 'vant'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const marketStore = useMarketStore()

// 响应式数据
const order = ref(null)
const submitting = ref(false)
const showConfirmDialog = ref(false)

const formData = ref({
  amount: ''
})

// 计算属性
const totalCost = computed(() => {
  const amount = parseFloat(formData.value.amount) || 0
  const unitPrice = parseFloat(order.value?.unitPrice) || 0
  const result = amount * unitPrice
  console.log('totalCost computed:', { amount, unitPrice, result })
  return isNaN(result) ? 0 : result
})

const fee = computed(() => {
  const cost = totalCost.value
  const result = cost * 0.003 // 千分之三手续费
  return isNaN(result) ? 0 : result
})

const finalCost = computed(() => {
  const cost = totalCost.value
  const feeAmount = fee.value
  const result = cost + feeAmount
  return isNaN(result) ? 0 : result
})

// 显示用的计算属性
const totalCostDisplay = computed({
  get() {
    const display = `¥${totalCost.value.toFixed(2)}`
    console.log('totalCostDisplay computed:', { totalCost: totalCost.value, display })
    return display
  },
  set(value) {
    // 只读字段，不需要处理 set
  }
})

const feeDisplay = computed({
  get() {
    const display = `¥${fee.value.toFixed(2)}`
    console.log('feeDisplay computed:', { fee: fee.value, display })
    return display
  },
  set(value) {
    // 只读字段，不需要处理 set
  }
})

const finalCostDisplay = computed({
  get() {
    const display = `¥${finalCost.value.toFixed(2)}`
    console.log('finalCostDisplay computed:', { finalCost: finalCost.value, display })
    return display
  },
  set(value) {
    // 只读字段，不需要处理 set
  }
})

const isFormValid = computed(() => {
  return formData.value.amount &&
         parseFloat(formData.value.amount) > 0 &&
         finalCost.value <= userStore.wallet.balance
})

// 方法
const onKeyDown = (event) => {
  // 允许的按键：数字、小数点、退格、删除、方向键、Tab、Enter
  const allowedKeys = [
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Tab', 'Enter', 'Home', 'End'
  ]
  
  // 如果是允许的特殊按键，直接放行
  if (allowedKeys.includes(event.key)) {
    return
  }
  
  // 如果是数字或小数点，允许输入
  if (/^[0-9.]$/.test(event.key)) {
    // 如果输入的是小数点，检查是否已经有小数点了
    if (event.key === '.' && formData.value.amount.includes('.')) {
      event.preventDefault()
    }
    return
  }
  
  // 其他按键阻止输入
  event.preventDefault()
}

const onFocus = (event) => {
  // 当用户点击输入框时，选中所有文本，方便用户直接输入新值
  setTimeout(() => {
    event.target.select()
  }, 0)
}

const onAmountChange = (value) => {
  // 只允许数字和小数点
  const cleanValue = value.replace(/[^0-9.]/g, '')
  
  // 确保只有一个小数点
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    formData.value.amount = parts[0] + '.' + parts.slice(1).join('')
  } else {
    formData.value.amount = cleanValue
  }
  
  console.log('Amount changed:', formData.value.amount)
  console.log('Total cost:', totalCost.value)
  console.log('Fee:', fee.value)
  console.log('Final cost:', finalCost.value)
  console.log('Order unit price:', order.value?.unitPrice)
}

const validateAmount = (value) => {
  if (!order.value) return false
  const amount = parseFloat(value)
  return amount > 0 && amount <= order.value.remainingAmount
}

const onSubmit = async () => {
  if (!isFormValid.value) return
  showConfirmDialog.value = true
}

const confirmBuy = async () => {
  submitting.value = true

  try {
    const amount = parseFloat(formData.value.amount)
    const result = await marketStore.buyPoints(order.value.id, amount)
    if (!result.success) { showToast(result.message); return }

    // 本地更新：扣余额、加积分
    userStore.updateWalletBalance(-finalCost.value)
    userStore.updatePoints(order.value.pointType, amount)

    // 添加购买记录到用户订单
    userStore.addOrder({
      type: 'buy',
      pointType: order.value.pointType,
      amount: amount,
      unitPrice: order.value.unitPrice,
      totalPrice: totalCost.value,
      fee: fee.value,
      status: 'completed',
      sellerId: order.value.sellerId,
      sellerName: order.value.sellerName
    })

    showSuccessToast('购买成功')
    router.push('/market')

  } catch (error) {
    showToast('购买失败，请重试')
  } finally {
    submitting.value = false
    showConfirmDialog.value = false
  }
}

const cancelBuy = () => {
  console.log('Purchase cancelled by user')
  showConfirmDialog.value = false
}

// 生命周期
onMounted(async () => {
  const orderId = route.params.id
  console.log('Looking for order ID:', orderId)
  console.log('Available orders:', marketStore.sellOrders)
  
  // 确保订单数据已加载
  if (marketStore.sellOrders.length === 0) {
    console.log('No orders loaded, fetching...')
    await marketStore.refreshOrders()
  }
  
  order.value = marketStore.getOrderById(orderId)
  console.log('Order loaded:', order.value)
  console.log('Order unitPrice:', order.value?.unitPrice)

  if (order.value) {
    // 设置默认购买数量为最大可购买数量，但允许用户修改
    formData.value.amount = order.value.remainingAmount.toFixed(4)
    console.log('Default amount set:', formData.value.amount)
    
    // 手动触发计算属性更新
    console.log('Triggering calculation with:', {
      amount: formData.value.amount,
      unitPrice: order.value.unitPrice,
      totalCost: totalCost.value,
      fee: fee.value,
      finalCost: finalCost.value
    })
    
    // 强制更新计算
    forceUpdateCalculations()
  } else {
    console.error('Order not found with ID:', orderId)
  }
})

// 监听订单数据变化
watch(() => order.value, (newOrder) => {
  console.log('Order changed:', newOrder)
  if (newOrder) {
    console.log('New order unitPrice:', newOrder.unitPrice)
  }
}, { immediate: true })

// 监听数量变化
watch(() => formData.value.amount, (newAmount) => {
  console.log('Amount changed to:', newAmount)
  console.log('Total cost will be:', totalCost.value)
  console.log('Fee will be:', fee.value)
  console.log('Final cost will be:', finalCost.value)
})

// 强制更新计算属性的方法
const forceUpdateCalculations = () => {
  console.log('Force updating calculations...')
  console.log('Current values:', {
    amount: formData.value.amount,
    unitPrice: order.value?.unitPrice,
    totalCost: totalCost.value,
    fee: fee.value,
    finalCost: finalCost.value
  })
}
</script>

<style scoped>
.buy {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 16px;
}

.error-state {
  padding: 60px 0;
}

.buy-container {
  max-width: 100%;
}

.card h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: var(--text-color);
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
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

.buy-form {
  margin-top: 16px;
}

.balance-check {
  margin: 16px 0;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.insufficient-balance {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FF4D4F;
  font-size: 14px;
  margin-top: 8px;
}

.submit-section {
  margin-top: 20px;
}

.confirm-content {
  padding: 16px;
  line-height: 2;
}

.confirm-content p {
  margin: 0;
  display: flex;
  justify-content: space-between;
}
</style>
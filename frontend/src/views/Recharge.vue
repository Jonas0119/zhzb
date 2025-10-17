<template>
  <div class="recharge">
    <div class="recharge-container">
      <!-- 充值表单 -->
      <div class="form-section card">
        <h3>充值金额</h3>
        
        <!-- 加载状态 -->
        <div v-if="loadingProducts" class="loading-section">
          <van-skeleton title :row="3" />
        </div>
        
        <!-- 产品选择 -->
        <div v-else class="product-selection">
          <div class="amount-shortcuts">
            <van-button
              v-for="product in rechargeProducts"
              :key="product.productId"
              size="small"
              :type="selectedProduct?.productId === product.productId ? 'primary' : 'default'"
              @click="selectProduct(product)"
            >
              {{ product.displayPrice }}
            </van-button>
          </div>
          
          <!-- 自定义金额输入 -->
          <!-- <van-field
            v-model="customAmount"
            name="customAmount"
            label="自定义金额"
            placeholder="请输入充值金额"
            type="number"
            @input="onCustomAmountInput"
          /> -->
        </div>

        <van-field
          name="currentBalance"
          label="当前余额"
          readonly
          v-model="currentBalanceModel"
        />

        <van-field
          name="afterRecharge"
          label="充值后余额"
          readonly
          v-model="afterAmountModel"
        />

        <div class="submit-section">
          <van-button
            type="primary"
            size="large"
            @click="onSubmit"
            :disabled="!isFormValid"
            :loading="submitting"
          >
            确认充值
          </van-button>
        </div>
      </div>

      <!-- 充值说明 -->
      <div class="notice-section card">
        <h4>充值说明</h4>
        <ul class="notice-list">
          <li>选择充值金额后，将跳转到Creem支付页面</li>
          <li>支持信用卡、借记卡等多种支付方式</li>
          <li>支付成功后，金额将立即到账</li>
          <li>充值记录将保存在资金明细中</li>
          <li>如有问题，请联系客服处理</li>
        </ul>
      </div>

      <!-- 最近充值记录 -->
      <div class="recent-records card">
        <h4>最近充值记录</h4>
        <div class="records-list">
          <div v-if="loadingRecords">
            <van-skeleton title :row="3" />
          </div>
          <div v-else-if="recentRecharges.length === 0">
            <van-empty description="暂无充值记录" />
          </div>
          <template v-else>
            <div
              v-for="record in recentRecharges"
              :key="record.id"
              class="record-item"
            >
              <div class="record-info">
                <div class="record-amount">+¥{{ Number(record.amount).toFixed(2) }}</div>
                <div class="record-time">{{ record.time }}</div>
              </div>
              <div class="record-status success">成功</div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 确认充值弹窗 -->
    <van-dialog
      v-model:show="showConfirmDialog"
      title="确认充值"
      show-cancel-button
      @confirm="confirmRecharge"
      @cancel="showConfirmDialog = false"
    >
      <div class="confirm-content">
        <p>充值金额: ¥{{ formData.amount }}</p>
        <p>充值后余额: ¥{{ afterRechargeBalance.toFixed(2) }}</p>
        <div id="payment-element"></div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { walletApi } from '@/utils/api'

const userStore = useUserStore()
const router = useRouter()

// 响应式数据
const submitting = ref(false)
const showConfirmDialog = ref(false)
const loadingProducts = ref(false)

// 充值产品列表
const rechargeProducts = ref([])
const selectedProduct = ref(null)
const customAmount = ref('')

// 最近充值记录（实时从后端获取）
const recentRecharges = ref([])
const loadingRecords = ref(false)

// 计算属性
const currentAmount = computed(() => {
  if (selectedProduct.value) {
    return selectedProduct.value.priceCNY
  }
  return parseFloat(customAmount.value) || 0
})

const afterRechargeBalance = computed(() => {
  return userStore.wallet.balance + currentAmount.value
})

// 当前余额 v-model 回显
const currentBalanceModel = computed({
  get() {
    const bal = Number(userStore.wallet.balance || 0)
    return `¥${bal.toFixed(2)}`
  },
  set(_) {}
})

// 用于 v-model 回显的计算属性（只读绑定）
const afterAmountModel = computed({
  get() {
    return `¥${afterRechargeBalance.value.toFixed(2)}`
  },
  set(_) {
    // 保持只读，不处理外部写入
  }
})

const isFormValid = computed(() => {
  return currentAmount.value > 0
})

// 方法
const selectProduct = (product) => {
  selectedProduct.value = product
  customAmount.value = '' // 清空自定义金额
}

const onCustomAmountInput = () => {
  selectedProduct.value = null // 清空选中的产品
}

const onSubmit = async () => {
  if (!isFormValid.value) {
    showToast('请选择充值金额')
    return
  }
  
  submitting.value = true
  try {
    let productId
    
    if (selectedProduct.value) {
      // 使用预设产品
      productId = selectedProduct.value.productId
    } else {
      // 自定义金额，需要找到最接近的产品
      const amount = parseFloat(customAmount.value)
      const closestProduct = rechargeProducts.value.find(p => p.priceCNY === amount)
      
      if (closestProduct) {
        productId = closestProduct.productId
      } else {
        showToast('请选择预设的充值金额')
        return
      }
    }
    
    // 调用充值接口
    await userStore.recharge(productId)
    
    // 如果返回了checkoutUrl，页面会自动跳转
    // 如果没有跳转，说明是模拟充值
    if (!selectedProduct.value) {
      showSuccessToast('充值成功')
      await userStore.fetchWalletInfo()
      await loadRecentRecharges()
      setTimeout(() => { router.back() }, 800)
    }
  } catch (error) {
    showToast('充值失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 页面加载时获取最新钱包余额与积分
onMounted(async () => {
  try {
    await userStore.fetchWalletInfo()
    await loadRechargeProducts()
    await loadRecentRecharges()
  } catch (e) {
    // 拉取失败不阻塞页面
  }
})

// 加载充值产品列表
const loadRechargeProducts = async () => {
  try {
    loadingProducts.value = true
    const products = await walletApi.getRechargeProducts()
    rechargeProducts.value = products
  } catch (error) {
    showToast('加载充值产品失败')
  } finally {
    loadingProducts.value = false
  }
}

// 加载最近充值记录（仅取前3条充值类型）
const loadRecentRecharges = async () => {
  try {
    loadingRecords.value = true
    const list = await walletApi.getTransactions({ page: 1, limit: 20 })
    const rechargeOnly = (list || []).filter(item => item.type === 'recharge')
    recentRecharges.value = rechargeOnly.slice(0, 3).map(r => ({
      id: r.id,
      amount: Number(r.amount),
      time: new Date(r.createdAt).toLocaleString('zh-CN')
    }))
  } catch (err) {
    // 忽略错误提示，页面已有其它提示
  } finally {
    loadingRecords.value = false
  }
}
</script>

<style scoped>
.recharge {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 16px;
}

.card {
  margin-bottom: 16px;
}

.card h3,
.card h4 {
  margin: 0 0 16px;
  color: var(--text-color);
}

.amount-shortcuts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 16px 0;
}

.amount-shortcuts .van-button {
  font-size: 14px;
}

.submit-section {
  margin-top: 24px;
}

.notice-section .notice-list {
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
}

.notice-list li {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 8px;
}

.records-list {
  max-height: 200px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.record-item:last-child {
  border-bottom: none;
}

.record-info {
  flex: 1;
}

.record-amount {
  font-size: 16px;
  font-weight: bold;
  color: var(--success-color);
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: var(--text-light);
}

.record-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
}

.record-status.success {
  background-color: var(--success-color);
}

.confirm-content {
  padding: 16px;
  line-height: 2;
}

.confirm-content p {
  margin: 0;
  text-align: center;
}
</style>
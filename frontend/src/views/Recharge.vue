<template>
  <div class="recharge">
    <div class="recharge-container">
      <!-- 充值表单 -->
      <div class="form-section card">
        <h3>充值金额</h3>
        <van-form @submit="onSubmit">
          <van-field
            v-model="formData.amount"
            name="amount"
            label="充值金额"
            placeholder="请输入充值金额"
            type="number"
            :rules="[
              { required: true, message: '请输入充值金额' },
              { pattern: /^\d+(\.\d{1,2})?$/, message: '最多保留2位小数' },
              { validator: validateAmount, message: '充值金额必须大于0' }
            ]"
          />

          <div class="amount-shortcuts">
            <van-button
              v-for="amount in quickAmounts"
              :key="amount"
              size="small"
              type="default"
              @click="selectAmount(amount)"
            >
              ¥{{ amount }}
            </van-button>
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
              native-type="submit"
              :disabled="!isFormValid"
              :loading="submitting"
            >
              确认充值
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 充值说明 -->
      <div class="notice-section card">
        <h4>充值说明</h4>
        <ul class="notice-list">
          <li>本应用为演示版本，采用模拟充值功能</li>
          <li>充值无需真实支付，点击确认即可到账</li>
          <li>充值金额将立即添加到您的钱包余额</li>
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
      @confirm="confirmRecharge"
      @cancel="showConfirmDialog = false"
    >
      <div class="confirm-content">
        <p>充值金额: ¥{{ formData.amount }}</p>
        <p>充值后余额: ¥{{ afterRechargeBalance.toFixed(2) }}</p>
        <p><strong>确认进行模拟充值操作？</strong></p>
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

const formData = ref({
  amount: ''
})

// 快捷金额选项
const quickAmounts = [100, 500, 1000, 2000, 5000, 10000]

// 最近充值记录（实时从后端获取）
const recentRecharges = ref([])
const loadingRecords = ref(false)

// 计算属性
const afterRechargeBalance = computed(() => {
  const amount = parseFloat(formData.value.amount) || 0
  return userStore.wallet.balance + amount
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
  const amount = parseFloat(formData.value.amount) || 0
  return amount > 0 && formData.value.amount !== ''
})

// 方法
const selectAmount = (amount) => {
  formData.value.amount = amount.toString()
}

const validateAmount = (value) => {
  const amount = parseFloat(value) || 0
  return amount > 0
}

const onSubmit = () => {
  if (!isFormValid.value) return
  showConfirmDialog.value = true
}

const confirmRecharge = async () => {
  submitting.value = true

  try {
    const amount = parseFloat(formData.value.amount)
    await userStore.recharge(amount)

    showSuccessToast('充值成功')

    // 重置表单并刷新列表/钱包
    formData.value.amount = ''
    await userStore.fetchWalletInfo()
    await loadRecentRecharges()

    setTimeout(() => { router.back() }, 800)

  } catch (error) {
    showToast('充值失败，请重试')
  } finally {
    submitting.value = false
    showConfirmDialog.value = false
  }
}

// 页面加载时获取最新钱包余额与积分
onMounted(async () => {
  try {
    await userStore.fetchWalletInfo()
    await loadRecentRecharges()
  } catch (e) {
    // 拉取失败不阻塞页面
  }
})

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
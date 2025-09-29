<template>
  <div class="wallet">
    <!-- 钱包余额卡片 -->
    <div class="balance-card gradient-bg">
      <div class="card-header">
        <h3>钱包余额(元)</h3>
        <van-icon name="eye-o" size="16" color="white" />
      </div>
      <div class="balance-amount">
        <span class="currency">¥</span>
        <span class="amount">{{ userStore.wallet.balance.toFixed(2) }}</span>
      </div>
      <div class="balance-detail">
        <div class="detail-item">
          <span>可提现额</span>
          <span>{{ userStore.wallet.balance.toFixed(2) }}</span>
        </div>
        <div class="detail-item">
          <span>冻结余额</span>
          <span>{{ userStore.wallet.frozenBalance.toFixed(2) }}</span>
        </div>
      </div>
      <div class="card-actions">
        <van-button type="primary" size="small" @click="$router.push('/recharge')">
          充值
        </van-button>
        <van-button type="default" size="small" @click="showWithdraw" style="margin-left: 8px;">
          提现
        </van-button>
      </div>
    </div>

    <!-- 积分余额卡片 -->
    <div class="points-card gradient-bg">
      <div class="card-header">
        <h3>积分余额</h3>
        <van-icon name="gem-o" size="16" color="white" />
      </div>
      <div class="points-grid">
        <div class="points-item">
          <div class="points-amount">{{ formatPoints(userStore.points.AIC) }}</div>
          <div class="points-label">AIC积分</div>
        </div>
        <div class="points-item">
          <div class="points-amount">{{ formatPoints(userStore.points.HH) }}</div>
          <div class="points-label">HH积分</div>
        </div>
      </div>
      <div class="frozen-info">
        <div class="frozen-item">
          <span>可用积分</span>
          <span>AIC: {{ formatPoints(userStore.points.AIC) }} | HH: {{ formatPoints(userStore.points.HH) }}</span>
        </div>
        <div class="frozen-item">
          <span>冻结积分</span>
          <span>AIC: {{ formatPoints(userStore.frozenPoints.AIC) }} | HH: {{ formatPoints(userStore.frozenPoints.HH) }}</span>
        </div>
      </div>
      <div class="card-actions">
        <van-button type="primary" size="small" @click="$router.push('/sell')">
          积分转卖
        </van-button>
      </div>
    </div>

    <!-- Tab功能区 -->
    <div class="tab-section">
      <van-tabs v-model:active="activeTab">
        <van-tab title="资金明细" name="balance">
          <div class="transaction-list">
            <van-skeleton v-if="loading" title :row="5" />
            <div v-else-if="balanceRecords.length === 0" class="empty-state">
              <van-empty description="暂无交易记录" />
            </div>
            <div
              v-else
              v-for="record in balanceRecords"
              :key="record.id"
              class="transaction-item"
            >
              <div class="transaction-info">
                <div class="transaction-title">{{ record.title }}</div>
                <div class="transaction-time">{{ record.time }}</div>
              </div>
              <div class="transaction-amount" :class="record.type">
                {{ record.type === 'income' ? '+' : '-' }}¥{{ Math.abs(record.amount).toFixed(2) }}
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="提现" name="withdraw">
          <div class="withdraw-section">
            <van-empty description="暂无提现记录">
            </van-empty>
          </div>
        </van-tab>

        <van-tab title="结算记录" name="settlement">
          <div class="transaction-list">
            <van-skeleton v-if="loading" title :row="5" />
            <div v-else-if="settlementRecords.length === 0" class="empty-state">
              <van-empty description="暂无结算记录" />
            </div>
            <div
              v-else
              v-for="record in settlementRecords"
              :key="record.id"
              class="transaction-item"
            >
              <div class="transaction-info">
                <div class="transaction-title">{{ record.title }}</div>
                <div class="transaction-time">{{ record.time }}</div>
              </div>
              <div class="transaction-amount" :class="record.type">
                {{ record.type === 'income' ? '+' : '-' }}¥{{ Math.abs(record.amount).toFixed(2) }}
              </div>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { walletApi } from '@/utils/api'
import { showToast } from 'vant'

const userStore = useUserStore()
const activeTab = ref('balance')
const loading = ref(false)
const balanceRecords = ref([])
const settlementRecords = ref([])

// 格式化积分显示
const formatPoints = (points) => {
  if (points === null || points === undefined || isNaN(points)) {
    return '0.0000'
  }
  return Number(points).toFixed(4)
}

// 页面加载时获取数据
onMounted(async () => {
  await loadWalletInfo()
  await loadTransactions()
})

// 监听tab切换，加载对应数据
watch(activeTab, async (newTab) => {
  if (newTab === 'balance') {
    await loadTransactions()
  } else if (newTab === 'settlement') {
    await loadSettlementRecords()
  }
})

// 加载钱包信息
const loadWalletInfo = async () => {
  try {
    await userStore.fetchWalletInfo()
  } catch (error) {
    console.error('Failed to load wallet info:', error)
    showToast('加载钱包信息失败')
  }
}

// 加载交易记录
const loadTransactions = async () => {
  try {
    loading.value = true
    const records = await walletApi.getTransactions({ page: 1, limit: 20 })
    balanceRecords.value = records.map(record => ({
      id: record.id,
      title: record.title,
      time: new Date(record.createdAt).toLocaleString('zh-CN'),
      amount: record.type === 'recharge' ? record.amount : -record.amount,
      type: record.type === 'recharge' ? 'income' : 'expense'
    }))
  } catch (error) {
    console.error('Failed to load transactions:', error)
    showToast('加载交易记录失败')
  } finally {
    loading.value = false
  }
}

// 加载结算记录（暂时使用交易记录）
const loadSettlementRecords = async () => {
  try {
    loading.value = true
    const records = await walletApi.getTransactions({ page: 1, limit: 20 })
    settlementRecords.value = records
      .filter(record => record.type === 'withdraw' || record.type === 'fee')
      .map(record => ({
        id: record.id,
        title: record.title,
        time: new Date(record.createdAt).toLocaleString('zh-CN'),
        amount: record.type === 'withdraw' ? -record.amount : -record.amount,
        type: record.type === 'withdraw' ? 'expense' : 'expense'
      }))
  } catch (error) {
    console.error('Failed to load settlement records:', error)
    showToast('加载结算记录失败')
  } finally {
    loading.value = false
  }
}

// 提现功能
const showWithdraw = () => {
  showToast('提现功能开发中')
}
</script>

<style scoped>
.wallet {
  min-height: 100vh;
  background-color: var(--background-color);
}

.balance-card,
.points-card {
  margin: 16px;
  padding: 20px;
  border-radius: 16px;
  color: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.balance-amount {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
}

.currency {
  font-size: 24px;
  margin-right: 4px;
}

.balance-detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 14px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-actions {
  text-align: right;
}

.points-grid {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.points-item {
  text-align: center;
}

.points-amount {
  font-size: 20px;
  font-weight: bold;
}

.points-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.frozen-info {
  font-size: 12px;
  margin-bottom: 16px;
}

.frozen-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.tab-section {
  margin: 16px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.transaction-list {
  padding: 16px;
  max-height: 50vh;
  overflow-y: auto;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 14px;
  color: var(--text-color);
  margin-bottom: 4px;
}

.transaction-time {
  font-size: 12px;
  color: var(--text-light);
}

.transaction-amount {
  font-size: 16px;
  font-weight: bold;
}

.transaction-amount.income {
  color: var(--success-color);
}

.transaction-amount.expense {
  color: #FF4D4F;
}

.withdraw-section {
  padding: 40px 0;
}
</style>
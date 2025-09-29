<template>
  <div class="market">
    <!-- 筛选和排序区域 -->
    <div class="filter-section">
      <div class="filter-bar">
        <van-button
          size="small"
          :type="filters.pointType === '' ? 'primary' : 'default'"
          @click="setFilter('pointType', '')"
        >
          全部
        </van-button>
        <van-button
          size="small"
          :type="filters.pointType === 'AIC' ? 'primary' : 'default'"
          @click="setFilter('pointType', 'AIC')"
        >
          AIC积分 ({{ pointTypeStats.AIC }})
        </van-button>
        <van-button
          size="small"
          :type="filters.pointType === 'HH' ? 'primary' : 'default'"
          @click="setFilter('pointType', 'HH')"
        >
          HH积分 ({{ pointTypeStats.HH }})
        </van-button>
      </div>

      <div class="sort-bar">
        <van-dropdown-menu>
          <van-dropdown-item v-model="currentSort" :options="sortOptions" @change="onSortChange" />
        </van-dropdown-menu>

        <van-button size="small" @click="showFilterPopup = true">
          <van-icon name="filter-o" />
          筛选
        </van-button>
      </div>
    </div>

    <!-- 卖单列表 -->
    <div class="orders-list">
      <div v-if="loading" class="skeleton">
        <van-skeleton title avatar :row="8" v-for="i in 4" :key="i" style="margin-bottom:12px;" />
      </div>

      <div v-else-if="filteredSellOrders.length === 0" class="empty-state">
        <van-empty description="暂无卖单">
          <van-button type="primary" @click="$router.push('/sell')">去发布卖单</van-button>
        </van-empty>
      </div>

      <div v-else>
        <div
          v-for="order in filteredSellOrders"
          :key="order.id"
          class="order-card"
          @click="buyOrder(order)"
        >
          <div class="order-header">
            <span class="point-type">{{ order.pointType }}积分</span>
            <span class="total-price">¥{{ order.totalPrice.toFixed(2) }}</span>
          </div>

          <div class="order-body">
            <div class="order-info">
              <div class="info-row">
                <span class="label">数量:</span>
                <span class="value">{{ order.remainingAmount.toFixed(4) }}</span>
              </div>
              <div class="info-row">
                <span class="label">单价:</span>
                <span class="value">¥{{ order.unitPrice.toFixed(2) }}</span>
              </div>
            </div>

            <van-button
              type="primary"
              size="small"
              class="buy-btn"
              @click.stop="buyOrder(order)"
            >
              买入
            </van-button>
          </div>

          <div class="order-footer">
            <span class="seller">卖家: {{ order.sellerName }}</span>
            <span class="time">{{ formatTime(order.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布卖单按钮 -->
    <van-floating-bubble
      axis="xy"
      icon="plus"
      @click="$router.push('/sell')"
    />

    <!-- 筛选弹窗 -->
    <van-popup v-model:show="showFilterPopup" position="bottom" class="filter-popup">
      <div class="filter-content">
        <div class="filter-header">
          <span>筛选条件</span>
          <van-button type="primary" size="mini" @click="clearFilters">重置</van-button>
        </div>

        <div class="filter-item">
          <div class="filter-label">价格区间</div>
          <van-field
            v-model="tempFilters.priceRange[0]"
            placeholder="最低价格"
            type="number"
          />
          <span class="range-separator">-</span>
          <van-field
            v-model="tempFilters.priceRange[1]"
            placeholder="最高价格"
            type="number"
          />
        </div>

        <div class="filter-item">
          <div class="filter-label">数量区间</div>
          <van-field
            v-model="tempFilters.amountRange[0]"
            placeholder="最少数量"
            type="number"
          />
          <span class="range-separator">-</span>
          <van-field
            v-model="tempFilters.amountRange[1]"
            placeholder="最多数量"
            type="number"
          />
        </div>

        <div class="filter-actions">
          <van-button @click="showFilterPopup = false">取消</van-button>
          <van-button type="primary" @click="applyFilters">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMarketStore } from '@/store/market'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const marketStore = useMarketStore()
const router = useRouter()

// 响应式数据
const showFilterPopup = ref(false)
const loading = ref(false)
const currentSort = ref('time-desc')

// 临时筛选条件
const tempFilters = ref({
  priceRange: [0, 999999],
  amountRange: [0, 999999]
})

// 计算属性
const filteredSellOrders = computed(() => {
  console.log('filteredSellOrders computed:', marketStore.filteredSellOrders)
  console.log('Raw sellOrders:', marketStore.sellOrders)
  return marketStore.filteredSellOrders
})
const pointTypeStats = computed(() => {
  console.log('pointTypeStats computed:', marketStore.pointTypeStats)
  return marketStore.pointTypeStats
})
const filters = computed(() => marketStore.filters)

// 排序选项
const sortOptions = [
  { text: '按时间降序', value: 'time-desc' },
  { text: '按时间升序', value: 'time-asc' },
  { text: '按价格降序', value: 'price-desc' },
  { text: '按价格升序', value: 'price-asc' },
  { text: '按数量降序', value: 'amount-desc' },
  { text: '按数量升序', value: 'amount-asc' }
]

// 方法
const setFilter = (key, value) => {
  marketStore.setFilter(key, value)
}

const onSortChange = (value) => {
  const [sortBy, sortOrder] = value.split('-')
  const sortMap = {
    'time': 'createdAt',
    'price': 'price',
    'amount': 'amount'
  }
  marketStore.setSorting(sortMap[sortBy], sortOrder)
}

const clearFilters = () => {
  marketStore.clearFilters()
  tempFilters.value = {
    priceRange: [0, 999999],
    amountRange: [0, 999999]
  }
}

const applyFilters = () => {
  marketStore.setFilter('priceRange', tempFilters.value.priceRange)
  marketStore.setFilter('amountRange', tempFilters.value.amountRange)
  showFilterPopup.value = false
  showToast('筛选条件已应用')
}

const buyOrder = (order) => {
  router.push(`/buy/${order.id}`)
}

const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  
  // 使用本地时区显示（如果服务器时间已经是正确的）
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

onMounted(async () => {
  try { 
    loading.value = true
    console.log('Starting to fetch orders...')
    
    // 使用强制刷新方法
    const orders = await marketStore.refreshOrders()
    console.log('Loaded orders:', orders)
    console.log('Store sellOrders after refresh:', marketStore.sellOrders)
    console.log('Point type stats:', marketStore.pointTypeStats)
    console.log('Filtered sell orders:', marketStore.filteredSellOrders)
    
    // 强制触发响应式更新
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log('After timeout - Store sellOrders:', marketStore.sellOrders)
    console.log('After timeout - Filtered orders:', marketStore.filteredSellOrders)
  } catch (error) {
    console.error('Failed to load market orders:', error)
    showToast('加载市场数据失败')
  } finally { 
    loading.value = false 
  }
})
</script>

<style scoped>
.market {
  min-height: 100vh;
  background-color: var(--background-color);
}

.filter-section {
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-bar .van-button {
  flex: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sort-bar .van-button {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.orders-list {
  padding: 12px 16px;
}

.empty-state {
  padding: 40px 0;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s;
}

.order-card:active {
  transform: scale(0.98);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.point-type {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
}

.total-price {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-info {
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
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

.buy-btn {
  margin-left: 16px;
  min-width: 60px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-light);
}

.van-floating-bubble {
  --van-floating-bubble-background: var(--primary-color);
}

.filter-popup {
  border-radius: 16px 16px 0 0;
}

.filter-content {
  padding: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: bold;
}

.filter-item {
  margin-bottom: 20px;
}

.filter-label {
  margin-bottom: 8px;
  font-weight: 500;
}

.filter-item .van-field {
  display: inline-block;
  width: 45%;
}

.range-separator {
  margin: 0 8px;
  color: var(--text-light);
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.filter-actions .van-button {
  flex: 1;
}
</style>
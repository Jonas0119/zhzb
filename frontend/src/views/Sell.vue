<template>
  <div class="sell">
    <div class="form-container">
      <van-form @submit="onSubmit">
        <div class="form-section">
          <h3>发布卖单</h3>

          <van-field
            name="pointType"
            label="积分类型"
            placeholder="请选择积分类型"
            readonly
            is-link
            v-model="selectedPointTypeText"
            @click="showPointTypePicker = true"
          />

          <van-field
            v-model="formData.amount"
            name="amount"
            label="数量"
            placeholder="请输入积分数量"
            type="number"
            :rules="[
              { required: true, message: '请输入积分数量' },
              { validator: validateAmount, message: '数量不能超过可用积分' }
            ]"
          />

          <van-field
            v-model="formData.unitPrice"
            name="unitPrice"
            label="单价(元)"
            placeholder="请输入单价"
            type="number"
            :rules="[
              { required: true, message: '请输入单价' },
              { pattern: /^\d+(\.\d{1,2})?$/, message: '最多保留2位小数' }
            ]"
          />

          <van-field
            name="totalPrice"
            label="预计总价"
            readonly
            v-model="totalPriceDisplay"
          />
        </div>

        <div class="balance-info">
          <div class="balance-item">
            <span>AIC可用积分:</span>
            <span class="amount-text">{{ userStore.points.AIC.toFixed(4) }}</span>
          </div>
          <div class="balance-item">
            <span>HH可用积分:</span>
            <span class="amount-text">{{ userStore.points.HH.toFixed(4) }}</span>
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
            发布卖单
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 积分类型选择器 -->
    <van-popup v-model:show="showPointTypePicker" position="bottom">
      <div class="point-type-picker">
        <div class="picker-header">
          <button @click="onPointTypeCancel" class="cancel-btn">取消</button>
          <span class="picker-title">选择积分类型</span>
          <button @click="onPointTypeConfirm" class="confirm-btn">确定</button>
        </div>
        <div class="point-type-list">
          <div 
            v-for="(pointType, index) in pointTypeColumns" 
            :key="index"
            class="point-type-item"
            :class="{ active: selectedPointTypeIndex === index }"
            @click="selectPointType(index)"
          >
            <div class="point-type-icon">
              <van-icon name="gold-coin" size="20" />
            </div>
            <div class="point-type-name">{{ pointType.text }}</div>
            <div v-if="selectedPointTypeIndex === index" class="check-icon">
              <van-icon name="success" size="16" />
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useMarketStore } from '@/store/market'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'

const userStore = useUserStore()
const marketStore = useMarketStore()
const router = useRouter()

// 响应式数据
const showPointTypePicker = ref(false)
const submitting = ref(false)
const selectedPointTypeIndex = ref(0)

const formData = ref({
  pointType: '',
  amount: '',
  unitPrice: ''
})

// 积分类型选项
const pointTypeColumns = [
  { text: 'AIC积分', value: 'AIC' },
  { text: 'HH积分', value: 'HH' }
]

// 计算属性
const selectedPointTypeText = computed({
  get() {
    console.log('Computing selectedPointTypeText, formData.pointType:', formData.value.pointType)
    if (!formData.value.pointType) return ''
    const pointType = pointTypeColumns.find(p => p.value === formData.value.pointType)
    console.log('Found pointType:', pointType)
    return pointType ? pointType.text : ''
  },
  set(value) {
    // 当用户直接输入时，这里不需要处理
    // 因为字段是只读的，只能通过选择器选择
  }
})

const totalPrice = computed(() => {
  const amount = parseFloat(formData.value.amount) || 0
  const unitPrice = parseFloat(formData.value.unitPrice) || 0
  const result = amount * unitPrice
  console.log('Total price calculation:', { amount, unitPrice, result })
  return result
})

const totalPriceDisplay = computed({
  get() {
    return `¥${totalPrice.value.toFixed(2)}`
  },
  set(value) {
    // 只读字段，不需要处理 set
  }
})

const isFormValid = computed(() => {
  return formData.value.pointType &&
         formData.value.amount &&
         formData.value.unitPrice &&
         parseFloat(formData.value.amount) > 0 &&
         parseFloat(formData.value.unitPrice) > 0
})

// 方法
const selectPointType = (index) => {
  selectedPointTypeIndex.value = index
}

const onPointTypeConfirm = () => {
  const selectedPointType = pointTypeColumns[selectedPointTypeIndex.value]
  console.log('Before update - formData.pointType:', formData.value.pointType)
  formData.value.pointType = selectedPointType.value
  console.log('After update - formData.pointType:', formData.value.pointType)
  console.log('selectedPointTypeText computed:', selectedPointTypeText.value)
  showToast(`已选择：${selectedPointType.text}`)
  showPointTypePicker.value = false
}

const onPointTypeCancel = () => {
  console.log('Point type selection cancelled')
  showPointTypePicker.value = false
}

const validateAmount = (value) => {
  if (!formData.value.pointType) return true
  const amount = parseFloat(value)
  const available = userStore.points[formData.value.pointType]
  return amount <= available
}

const onSubmit = async () => {
  if (!isFormValid.value) return

  submitting.value = true

  try {
    // 准备API请求数据
    const requestData = {
      pointType: formData.value.pointType,
      amount: parseFloat(formData.value.amount),
      unitPrice: parseFloat(formData.value.unitPrice)
    }

    // 调用后端API
    const newOrder = await marketStore.addSellOrder(requestData)

    showSuccessToast('卖单发布成功')
    router.back()

  } catch (error) {
    console.error('发布卖单失败:', error)
    showToast(error.response?.data?.message || '发布失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.sell {
  min-height: 100vh;
  background-color: var(--background-color);
}

.form-container {
  padding: 20px 16px;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.form-section h3 {
  margin: 0 0 20px;
  font-size: 18px;
  color: var(--text-color);
}

.balance-info {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.balance-item:last-child {
  border-bottom: none;
}

.submit-section {
  padding: 0 4px;
}

/* 积分类型选择器样式 */
.point-type-picker {
  background: white;
  border-radius: 20px 20px 0 0;
  max-height: 70vh;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: white;
  border-radius: 20px 20px 0 0;
}

.cancel-btn, .confirm-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #1989fa;
  cursor: pointer;
  padding: 8px 12px;
}

.cancel-btn {
  color: #969799;
}

.picker-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.point-type-list {
  max-height: 50vh;
  overflow-y: auto;
  padding: 8px 0;
}

.point-type-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.point-type-item:hover {
  background-color: #f7f8fa;
}

.point-type-item.active {
  background-color: #e8f4ff;
}

.point-type-icon {
  margin-right: 12px;
  color: #ff6b35;
}

.point-type-name {
  flex: 1;
  font-size: 16px;
  color: #323233;
}

.check-icon {
  color: #1989fa;
}
</style>
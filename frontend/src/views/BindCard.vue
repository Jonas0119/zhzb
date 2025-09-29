<template>
  <div class="bind-card">
    <div class="bind-container">
      <!-- 绑定表单 -->
      <div class="form-section card">
        <h3>{{ isEditing ? '重新绑定银行卡' : '绑定银行卡' }}</h3>
        <van-form @submit="onSubmit">
          <van-field
            v-model="formData.cardNumber"
            name="cardNumber"
            label="卡号"
            placeholder="请输入银行卡号"
            @input="onCardNumberInput"
            :rules="[
              { required: true, message: '请输入银行卡号' },
              { validator: validateCardNumber, message: '请输入正确的银行卡号' }
            ]"
          />

          <van-field
            v-model="formData.holderName"
            name="holderName"
            label="持卡人"
            placeholder="请输入持卡人姓名"
            :rules="[
              { required: true, message: '请输入持卡人姓名' }
            ]"
          />

          <van-field
            v-model="formData.bankName"
            name="bankName"
            label="银行"
            placeholder="请选择开户银行"
            readonly
            is-link
            @click="openBankPicker"
            :rules="[
              { required: true, message: '请选择开户银行' }
            ]"
          />

          <van-field
            v-model="formData.phone"
            name="phone"
            label="手机号"
            placeholder="请输入银行预留手机号"
            :rules="[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]"
          />

          <div class="submit-section">
            <van-button
              type="primary"
              size="large"
              native-type="submit"
              :disabled="!isFormValid"
              :loading="submitting"
            >
              {{ isEditing ? '重新绑定' : '立即绑定' }}
            </van-button>
            <van-button
              v-if="isEditing"
              type="default"
              size="large"
              style="margin-top: 12px;"
              @click="cancelEdit"
            >
              取消编辑
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 温馨提示 -->
      <div class="notice-section card">
        <h4>温馨提示</h4>
        <ul class="notice-list">
          <li>本功能为演示功能，不会进行真实银行卡验证</li>
          <li>请确保输入的信息准确无误</li>
          <li>银行卡信息仅用于演示，不会保存到真实数据库</li>
          <li>绑定成功后可在钱包中查看卡片信息</li>
          <li>如需解绑，请联系客服处理</li>
        </ul>
      </div>

      <!-- 已绑定的银行卡 -->
      <div v-if="userStore.bankCards.length > 0" class="cards-section card">
        <h4>已绑定银行卡</h4>
        <div class="cards-list">
          <div
            v-for="card in userStore.bankCards"
            :key="card.id"
            class="card-item"
            @click="editCard(card)"
          >
            <div class="card-info">
              <div class="card-number">{{ card.cardNumber }}</div>
              <div class="card-bank">{{ card.bankName }}</div>
              <div class="card-holder">{{ card.holderName }}</div>
            </div>
            <div class="card-actions">
              <span v-if="card.isDefault" class="default-badge">默认</span>
              <van-icon name="edit" size="16" color="#999" />
            </div>
          </div>
        </div>
        <div class="card-tips">
          <van-icon name="info-o" size="14" color="#999" />
          <span>点击银行卡可重新绑定，新卡将替换当前卡片</span>
        </div>
      </div>
    </div>

    <!-- 银行选择器 -->
    <van-popup v-model:show="showBankPicker" position="bottom">
      <div class="bank-picker">
        <div class="picker-header">
          <button @click="onBankCancel" class="cancel-btn">取消</button>
          <span class="picker-title">选择银行</span>
          <button @click="onBankConfirm" class="confirm-btn">确定</button>
        </div>
        <div class="bank-list">
          <div 
            v-for="(bank, index) in bankList" 
            :key="index"
            class="bank-item"
            :class="{ active: selectedBankIndex === index }"
            @click="selectBank(index)"
          >
            <div class="bank-icon">
              <van-icon name="credit-pay" size="20" />
            </div>
            <div class="bank-name">{{ bank }}</div>
            <div v-if="selectedBankIndex === index" class="check-icon">
              <van-icon name="success" size="16" />
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'

const userStore = useUserStore()
const router = useRouter()

// 响应式数据
const submitting = ref(false)
const showBankPicker = ref(false)
const isEditing = ref(false)
const editingCardId = ref(null)
const selectedBankIndex = ref(0)

const formData = ref({
  cardNumber: '',
  holderName: '',
  bankName: '',
  phone: ''
})

// 银行列表
const bankList = [
  '中国工商银行',
  '中国建设银行', 
  '中国农业银行',
  '中国银行',
  '交通银行',
  '招商银行',
  '中信银行',
  '光大银行',
  '华夏银行',
  '民生银行',
  '广发银行',
  '平安银行',
  '浦发银行',
  '兴业银行'
]


// 计算属性
const isFormValid = computed(() => {
  return formData.value.cardNumber &&
         formData.value.holderName &&
         formData.value.bankName &&
         formData.value.phone &&
         validateCardNumber(formData.value.cardNumber) &&
         /^1[3-9]\d{9}$/.test(formData.value.phone)
})

// 银行卡号前缀识别银行
const getBankByCardNumber = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\s/g, '')
  
  // 银行卡号前缀识别规则
  const bankRules = {
    '中国工商银行': ['622202', '622208', '622200', '955880', '621226', '621281', '621558', '621559', '621722', '621723'],
    '中国建设银行': ['622700', '622280', '436742', '436745', '436748', '489592', '532450', '532458', '622166', '622168'],
    '中国农业银行': ['622848', '622845', '622846', '622849', '103', '95599', '622848', '622845', '622846', '622849'],
    '中国银行': ['621661', '621662', '621663', '621667', '621668', '621669', '621670', '621671', '621672', '621673'],
    '交通银行': ['622260', '622261', '622262', '622263', '622264', '622265', '622266', '622267', '622268', '622269'],
    '招商银行': ['622588', '622575', '622576', '622577', '622578', '622579', '622580', '622581', '622582', '622583'],
    '中信银行': ['622690', '622691', '622692', '622693', '622694', '622695', '622696', '622697', '622698', '622699'],
    '光大银行': ['622650', '622651', '622652', '622653', '622654', '622655', '622656', '622657', '622658', '622659'],
    '华夏银行': ['622630', '622631', '622632', '622633', '622634', '622635', '622636', '622637', '622638', '622639'],
    '民生银行': ['622600', '622601', '622602', '622603', '622604', '622605', '622606', '622607', '622608', '622609'],
    '广发银行': ['622568', '622569', '622570', '622571', '622572', '622573', '622574', '622575', '622576', '622577'],
    '平安银行': ['622155', '622156', '622157', '622158', '622159', '622160', '622161', '622162', '622163', '622164'],
    '浦发银行': ['622521', '622522', '622523', '622524', '622525', '622526', '622527', '622528', '622529', '622530'],
    '兴业银行': ['622909', '622910', '622911', '622912', '622913', '622914', '622915', '622916', '622917', '622918']
  }
  
  for (const [bankName, prefixes] of Object.entries(bankRules)) {
    for (const prefix of prefixes) {
      if (cleanNumber.startsWith(prefix)) {
        return bankName
      }
    }
  }
  
  return null
}

// 方法
const validateCardNumber = (value) => {
  // 简单的银行卡号验证（16-19位数字）
  return /^\d{16,19}$/.test(value.replace(/\s/g, ''))
}

const selectBank = (index) => {
  selectedBankIndex.value = index
}

const onBankConfirm = () => {
  const selectedBank = bankList[selectedBankIndex.value]
  formData.value.bankName = selectedBank
  console.log('Bank confirmed:', selectedBank, 'formData:', formData.value)
  showToast(`已选择：${selectedBank}`)
  showBankPicker.value = false
}

const onBankCancel = () => {
  console.log('Bank selection cancelled')
  showBankPicker.value = false
}

// 打开银行选择器
const openBankPicker = () => {
  console.log('Opening bank picker, current bank:', formData.value.bankName)
  console.log('Bank list:', bankList)
  // 设置当前选中的银行索引
  if (formData.value.bankName) {
    const index = bankList.findIndex(bank => bank === formData.value.bankName)
    selectedBankIndex.value = index >= 0 ? index : 0
  } else {
    selectedBankIndex.value = 0
  }
  showBankPicker.value = true
}

// 银行卡号输入处理
const onCardNumberInput = (value) => {
  // 自动识别银行
  const detectedBank = getBankByCardNumber(value)
  if (detectedBank) {
    formData.value.bankName = detectedBank
    showToast(`已自动识别为${detectedBank}`)
  }
}


const formatCardNumber = (cardNumber) => {
  // 格式化卡号显示（隐藏中间位数）
  const cleanNumber = cardNumber.replace(/\s/g, '')
  if (cleanNumber.length >= 8) {
    const first4 = cleanNumber.slice(0, 4)
    const last4 = cleanNumber.slice(-4)
    return `${first4} **** **** ${last4}`
  }
  return cardNumber
}

// 编辑卡片
const editCard = (card) => {
  isEditing.value = true
  editingCardId.value = card.id
  formData.value = {
    cardNumber: card.cardNumber.replace(/\s/g, '').replace(/\*/g, ''),
    holderName: card.holderName || '',
    bankName: card.bankName || '',
    phone: card.phone || ''
  }
  // 滚动到表单顶部
  document.querySelector('.form-section')?.scrollIntoView({ behavior: 'smooth' })
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editingCardId.value = null
  formData.value = {
    cardNumber: '',
    holderName: '',
    bankName: '',
    phone: ''
  }
}

const onSubmit = async () => {
  if (!isFormValid.value) return

  submitting.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (isEditing.value) {
      // 重新绑定银行卡（替换现有卡片）
      await userStore.bindBankCard({
        cardNumber: formData.value.cardNumber.replace(/\s/g, ''),
        holderName: formData.value.holderName,
        bankName: formData.value.bankName,
        phone: formData.value.phone
      })
      showSuccessToast('银行卡重新绑定成功')
    } else {
      // 新绑定银行卡
      await userStore.bindBankCard({
        cardNumber: formData.value.cardNumber.replace(/\s/g, ''),
        holderName: formData.value.holderName,
        bankName: formData.value.bankName,
        phone: formData.value.phone
      })
      showSuccessToast('银行卡绑定成功')
    }

    // 重置表单
    cancelEdit()

    // 延迟返回
    setTimeout(() => { router.back() }, 800)

  } catch (error) {
    showToast('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  userStore.fetchBankCards()
})
</script>

<style scoped>
.bind-card {
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

.notice-section h4 {
  font-size: 16px;
  margin-bottom: 12px;
}

.submit-section {
  margin-top: 24px;
}

.notice-section .notice-list {
  margin: 0;
  padding-left: 16px;
  line-height: 1.5;
}

.notice-list li {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.cards-list {
  display: grid;
  gap: 12px;
}

.card-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--background-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.card-item:hover {
  background: #f8f9fa;
  border-color: var(--primary-color);
}

.card-info {
  flex: 1;
}

.card-number {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 4px;
  font-family: 'Courier New', monospace;
}

.card-bank {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 2px;
}

.card-holder {
  font-size: 12px;
  color: var(--text-light);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.default-badge {
  font-size: 10px;
  background: var(--primary-color);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-tips {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

/* 银行选择器样式 */
.bank-picker {
  background: white;
  border-radius: 20px 20px 0 0;
  max-height: 70vh;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

.picker-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.9;
}

.cancel-btn, .confirm-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.cancel-btn:hover, .confirm-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.picker-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.bank-list {
  max-height: 50vh;
  overflow-y: auto;
  background: #fafbfc;
}

.bank-item {
  padding: 18px 24px;
  border-bottom: 1px solid #e8eaed;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
  margin: 0 12px 8px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: 16px;
}

.bank-item:last-child {
  margin-bottom: 12px;
}

.bank-item:hover {
  background: linear-gradient(135deg, #f8f9ff 0%, #e6f3ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.bank-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.bank-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f0f2ff 0%, #e6f0ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  flex-shrink: 0;
}

.bank-item.active .bank-icon {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.bank-name {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.bank-item.active .bank-name {
  color: white;
  font-weight: 600;
}

.check-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

/* 滚动条样式 */
.bank-list::-webkit-scrollbar {
  width: 6px;
}

.bank-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.bank-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.bank-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}
</style>
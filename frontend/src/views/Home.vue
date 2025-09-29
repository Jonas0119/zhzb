<template>
  <div class="home">
    <!-- 顶部标题区域 -->
    <div class="header">
      <div class="header-content">
        <div class="title-section">
          <div class="app-icon">
            <van-icon name="balance-pay" size="32" color="#FF7F50" />
          </div>
          <h1 class="title">智慧账簿</h1>
        </div>
        <div class="subtitle">积分钱包管理平台</div>
      </div>
    </div>

    <!-- 主要功能区 -->
    <div class="main-actions">
      <van-button
        type="primary"
        size="large"
        class="invite-btn"
        @click="inviteSeller"
      >
        <van-icon name="shop-o" size="18" />
        邀请商家入驻
      </van-button>

      <van-button
        size="large"
        class="rules-btn"
        @click="showRules"
      >
        <van-icon name="question-o" size="18" />
        积分玩法规则
      </van-button>
    </div>

    <!-- 积分展示区 -->
    <div class="points-section">
      <div class="section-header">
        <h2 class="section-title">
          <van-icon name="gem" size="20" color="#FF7F50" />
          我的积分
        </h2>
        <div class="total-points">
          总价值: ¥{{ totalValue.toFixed(2) }}
        </div>
      </div>
      <div class="points-grid">
        <div class="point-item aic-points">
          <div class="point-header">
            <div class="point-icon">
              <van-icon name="gold-coin" size="32" color="white" />
            </div>
            <div class="point-info">
              <div class="point-name">AIC积分</div>
              <div class="point-amount">
                <van-skeleton v-if="loading" title :row="1" />
                <span v-else>{{ formatPoints(userStore.points.AIC) }}</span>
              </div>
            </div>
          </div>
          <div class="point-value">
            ¥{{ (userStore.points.AIC * 1.05).toFixed(2) }}
          </div>
        </div>

        <div class="point-item hh-points">
          <div class="point-header">
            <div class="point-icon">
              <van-icon name="diamond" size="32" color="white" />
            </div>
            <div class="point-info">
              <div class="point-name">HH积分</div>
              <div class="point-amount">
                <van-skeleton v-if="loading" title :row="1" />
                <span v-else>{{ formatPoints(userStore.points.HH) }}</span>
              </div>
            </div>
          </div>
          <div class="point-value">
            ¥{{ (userStore.points.HH * 1.05).toFixed(2) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 规则说明弹窗 -->
    <van-popup v-model:show="showRulesPopup" position="center" class="rules-popup">
      <div class="rules-content">
        <h3>积分玩法规则</h3>
        <div class="rules-text">
          <p><strong>1. 积分获取</strong></p>
          <p>• 积分由管理员发放，无其他获取方式</p>
          <p>• 支持AIC积分和HH积分两种类型</p>

          <p><strong>2. 积分交易</strong></p>
          <p>• 用户可自由定价买卖积分</p>
          <p>• 交易手续费为千分之三</p>
          <p>• 支付方式为模拟支付，即时到账</p>

          <p><strong>3. 积分使用</strong></p>
          <p>• 积分可在市场自由交易</p>
          <p>• 卖单发布后积分冻结，取消后解冻</p>
          <p>• 积分交易无时间和金额限制</p>
        </div>
        <van-button type="primary" @click="showRulesPopup = false">我知道了</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { showToast } from 'vant'

const userStore = useUserStore()
const showRulesPopup = ref(false)
const loading = ref(false)

// 计算总价值
const totalValue = computed(() => {
  const aicValue = (userStore.points.AIC || 0) * 1.05
  const hhValue = (userStore.points.HH || 0) * 1.05
  return aicValue + hhValue
})

// 页面加载时获取钱包信息
onMounted(async () => {
  await loadWalletInfo()
})

// 加载钱包信息
const loadWalletInfo = async () => {
  try {
    loading.value = true
    await userStore.fetchWalletInfo()
  } catch (error) {
    console.error('Failed to load wallet info:', error)
    showToast('加载钱包信息失败')
  } finally {
    loading.value = false
  }
}

// 格式化积分显示
const formatPoints = (points) => {
  if (points === null || points === undefined || isNaN(points)) {
    return '0.0000'
  }
  return Number(points).toFixed(4)
}

const inviteSeller = () => {
  showToast('邀请功能开发中，敬请期待！')
}

const showRules = () => {
  showRulesPopup.value = true
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #fafafa;
}

.header {
  background: linear-gradient(135deg, #FF7F50 0%, #FF6B35 100%);
  padding: 40px 20px 30px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.header-content {
  position: relative;
  z-index: 1;
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.app-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.title {
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 400;
  margin: 0;
}

.main-actions {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-btn {
  width: 100%;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(255, 127, 80, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.rules-btn {
  width: 100%;
  height: 48px;
  background: white;
  color: #FF7F50;
  border: 1px solid #FF7F50;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.rules-btn:hover {
  background: #FF7F50;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 127, 80, 0.3);
}

.points-section {
  margin: 0 20px 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-points {
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 500;
  border: 1px solid #e8e8e8;
}

.points-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.point-item {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.point-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #FF7F50, #FF6B35);
}

.point-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(255, 127, 80, 0.2);
}

.point-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.point-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #FF7F50, #FF6B35);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(255, 127, 80, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.point-info {
  flex: 1;
}

.point-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.point-amount {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
}

.point-value {
  font-size: 18px;
  font-weight: 600;
  color: #FF7F50;
  text-align: right;
  background: #fafafa;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.rules-popup {
  border-radius: 20px;
  overflow: hidden;
  max-width: 340px;
  width: 90vw;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.rules-content {
  padding: 32px 24px;
  background: white;
}

.rules-content h3 {
  margin: 0 0 20px;
  text-align: center;
  color: var(--text-color);
  font-size: 20px;
  font-weight: 700;
}

.rules-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-light);
  margin-bottom: 24px;
}

.rules-text p {
  margin: 12px 0;
}

.rules-text strong {
  color: var(--text-color);
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .header {
    padding: 30px 16px 24px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .app-icon {
    width: 40px;
    height: 40px;
  }
  
  .main-actions {
    padding: 20px 16px;
  }
  
  .points-section {
    margin: 0 16px 20px;
  }
}
</style>
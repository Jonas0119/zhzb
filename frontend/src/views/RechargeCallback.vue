<template>
  <div class="recharge-callback">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <van-loading size="24px" vertical>处理中...</van-loading>
    </div>
    
    <!-- 支付结果 -->
    <div v-else class="result-container">
      <!-- 状态图标卡片 -->
      <div class="status-card gradient-bg">
        <div class="status-icon">
          <van-icon 
            :name="status === 'success' ? 'success' : 'error'" 
            size="48" 
            :color="status === 'success' ? 'var(--success-color)' : 'var(--warning-color)'" 
          />
        </div>
        <h2 class="status-title">{{ title }}</h2>
        <p class="status-message">{{ message }}</p>
      </div>

      <!-- 支付详情卡片 -->
      <div v-if="status === 'success'" class="details-card">
        <div class="card-header">
          <h3>支付详情</h3>
          <van-icon name="info-o" size="16" color="#666" />
        </div>
        <div class="detail-item">
          <span>充值金额</span>
          <span class="amount">¥{{ amount }}</span>
        </div>
        <div class="detail-item">
          <span>当前余额</span>
          <span class="amount">¥{{ balance }}</span>
        </div>
        <div class="detail-item">
          <span>支付时间</span>
          <span>{{ paymentTime }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button 
          type="primary" 
          size="large" 
          block 
          @click="goToWallet"
          class="primary-button"
        >
          查看钱包
        </van-button>
        <van-button 
          type="default" 
          size="large" 
          block 
          @click="goToRecharge"
          class="secondary-button"
        >
          继续充值
        </van-button>
      </div>

      <!-- 调试信息（开发环境显示） -->
      <div v-if="debugInfo && isDevelopment" class="debug-card">
        <div class="card-header">
          <h3>调试信息</h3>
          <van-icon name="setting-o" size="16" color="#999" />
        </div>
        <div class="debug-item">
          <span>Checkout ID:</span>
          <span class="debug-value">{{ debugInfo.checkout_id }}</span>
        </div>
        <div class="debug-item">
          <span>Order ID:</span>
          <span class="debug-value">{{ debugInfo.order_id }}</span>
        </div>
        <div class="debug-item">
          <span>Customer ID:</span>
          <span class="debug-value">{{ debugInfo.customer_id }}</span>
        </div>
        <div class="debug-item">
          <span>Product ID:</span>
          <span class="debug-value">{{ debugInfo.product_id }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const loading = ref(true);
const status = ref('success');
const title = ref('支付结果');
const message = ref('处理中...');
const amount = ref(0);
const balance = ref(0);
const paymentTime = ref('');
const debugInfo = ref(null);
const isDevelopment = ref(process.env.NODE_ENV === 'development');

onMounted(async () => {
  console.log('=== RechargeCallback 组件挂载 ===');
  console.log('当前路由:', route.path);
  console.log('查询参数:', route.query);
  console.log('完整URL:', window.location.href);
  
  try {
    // 获取URL参数
    const { checkout_id, order_id, customer_id, product_id, signature } = route.query;
    console.log('Creem回调参数:', { 
      checkout_id, 
      order_id, 
      customer_id, 
      product_id, 
      signature: signature ? signature.substring(0, 10) + '...' : 'none'
    });
    
    // 保存调试信息
    debugInfo.value = {
      checkout_id,
      order_id,
      customer_id,
      product_id
    };
    
    // 检查是否有必要的参数
    if (!checkout_id || !order_id) {
      console.warn('缺少必要的支付参数');
      status.value = 'error';
      title.value = '支付失败';
      message.value = '支付参数不完整';
      showToast('支付参数错误');
      return;
    }
    
    // 刷新用户钱包信息
    console.log('开始获取钱包信息...');
    const walletInfo = await userStore.fetchWalletInfo();
    balance.value = walletInfo.balance;
    console.log('钱包信息获取成功:', walletInfo);
    
    // 设置支付时间
    paymentTime.value = new Date().toLocaleString('zh-CN');
    
    // 根据URL参数判断支付状态
    if (checkout_id && order_id) {
      status.value = 'success';
      title.value = '支付成功';
      message.value = '充值成功，余额已更新';
      
      // 尝试从产品配置中获取金额（这里需要根据实际产品ID映射）
      const productAmountMap = {
        'prod_76gXeKJ2o34gGcd47LZYdL': 100,   // 充值100元
        'prod_7g5JTReDwsZ7CqqBpdG6C5': 500,   // 充值500元
        'prod_6kk3Wbz6pvDwMK46px4D9A': 1000,  // 充值1000元
        'prod_1hKo0OkAJlOdhizEHtS8Yj': 2000,  // 充值2000元
        'prod_2n5Lm8nXAEEo8TYcI1gO8F': 5000,  // 充值5000元
        'prod_7ldwdnPQRA7C9P6WE8XkVI': 10000, // 充值10000元
      };
      amount.value = productAmountMap[product_id] || 0;
      
      console.log('产品ID映射结果:', {
        product_id,
        mapped_amount: amount.value,
        available_products: Object.keys(productAmountMap)
      });
      
      showToast('充值成功');
      console.log('支付成功处理完成');
    } else {
      status.value = 'error';
      title.value = '支付失败';
      message.value = '支付过程中出现问题';
      showToast('支付失败');
      console.log('支付失败处理完成');
    }
  } catch (error) {
    console.error('RechargeCallback 处理错误:', error);
    console.error('错误堆栈:', error.stack);
    status.value = 'error';
    title.value = '支付失败';
    message.value = '获取支付结果失败，请重试';
    showToast('支付失败');
  } finally {
    loading.value = false;
    console.log('=== RechargeCallback 处理完成 ===');
  }
});

// 跳转到钱包页面
const goToWallet = () => {
  console.log('跳转到钱包页面...');
  router.push('/profile');
  //router.push('/wallet');
};

// 跳转到充值页面
const goToRecharge = () => {
  console.log('跳转到充值页面...');
  router.push('/recharge');
};
</script>

<style scoped>
/* 页面容器 */
.recharge-callback {
  min-height: 100vh;
  background: var(--primary-gradient);
  padding: 16px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: white;
}

/* 结果容器 */
.result-container {
  max-width: 400px;
  margin: 0 auto;
}

/* 状态卡片 - 与钱包页面保持一致 */
.status-card {
  background: var(--primary-gradient);
  color: white;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.status-icon {
  margin-bottom: 16px;
}

.status-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.status-message {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

/* 详情卡片 */
.details-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item span:first-child {
  color: #666;
  font-size: 14px;
}

.amount {
  font-size: 16px;
  font-weight: bold;
  color: var(--success-color);
}

/* 操作按钮 */
.action-buttons {
  margin-bottom: 16px;
}

.primary-button {
  margin-bottom: 12px;
  background: white;
  color: var(--primary-color);
  border: 2px solid white;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.primary-button:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.secondary-button {
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

/* 调试信息卡片 */
.debug-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e9ecef;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 12px;
}

.debug-item span:first-child {
  color: #666;
  font-weight: 500;
}

.debug-value {
  color: #999;
  font-family: monospace;
  word-break: break-all;
  max-width: 60%;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .recharge-callback {
    padding: 12px;
  }
  
  .status-card {
    padding: 24px 20px;
  }
  
  .status-title {
    font-size: 20px;
  }
  
  .status-message {
    font-size: 14px;
  }
}

/* 动画效果 */
.status-card {
  animation: slideInUp 0.6s ease-out;
}

.details-card {
  animation: slideInUp 0.6s ease-out 0.2s both;
}

.action-buttons {
  animation: slideInUp 0.6s ease-out 0.4s both;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

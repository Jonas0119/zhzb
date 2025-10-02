import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { injectSpeedInsights } from '@vercel/speed-insights'; // 正确导入方式

// 引入Vant组件
import Vant from 'vant'
import 'vant/lib/index.css'

// 引入全局样式
import './assets/styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Vant)
injectSpeedInsights(app); 
app.mount('#app')

// 应用启动时尝试恢复登录态并拉取钱包信息
nextTick(async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    const { useUserStore } = await import('./store/user')
    const { userApi } = await import('./utils/api')
    const userStore = useUserStore()
    const profile = await userApi.getProfile()
    userStore.userInfo = {
      id: profile.id,
      username: profile.username,
      phone: profile.phone || '',
      avatar: ''
    }
    await userStore.fetchWalletInfo()
  } catch (e) {
    // token 无效则忽略
  }
})
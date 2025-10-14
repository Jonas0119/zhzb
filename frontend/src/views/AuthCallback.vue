<template>
  <div class="auth-callback">
    <div class="loading-container">
      <van-loading size="24px" vertical>正在处理登录...</van-loading>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/config/supabase'
import { userApi } from '@/utils/api'
import { showToast } from 'vant'

const router = useRouter()

onMounted(async () => {
  try {
    // 处理 OAuth 回调
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }

    if (data.session) {
      // 获取 access token
      const accessToken = data.session.access_token
      // 判断 provider
      const provider = new URLSearchParams(window.location.search).get('provider') || 'github'
      // 使用 access token 调用后端 API
      const response = provider === 'google'
        ? await userApi.googleLogin({ accessToken })
        : await userApi.githubLogin({ accessToken })
      
      // 保存用户信息和 token
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      showToast('登录成功')
      
      // 重定向到首页或指定页面
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/'
      router.replace(redirect)
    } else {
      throw new Error('未获取到会话信息')
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    showToast('登录失败，请重试')
    router.replace('/login')
  }
})
</script>

<style scoped>
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f7f8fa;
}

.loading-container {
  text-align: center;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>

<template>
  <div class="github-login">
    <van-button 
      type="primary" 
      size="large" 
      block 
      :loading="loading"
      @click="handleGitHubLogin"
      class="github-button"
    >
      <template #icon>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </template>
      使用 GitHub 登录
    </van-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/config/supabase'
import { userApi } from '@/utils/api'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const handleGitHubLogin = async () => {
  try {
    loading.value = true
    
    // 使用 Supabase 进行 GitHub OAuth 认证
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw error
    }

    // 如果成功，用户会被重定向到 GitHub
    console.log('GitHub OAuth initiated:', data)
  } catch (error) {
    console.error('GitHub login error:', error)
    showToast('GitHub 登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.github-login {
  margin: 16px 0;
}

/* 颜色保持 GitHub 深色，与上方主登录按钮做区分 */
.github-button {
  background-color: #24292e;
  border-color: #24292e;
  color: #ffffff;
  font-size: 16px; /* 与上方“登录”按钮保持一致 */
  font-weight: 500;
}

.github-button:hover {
  background-color: #1a1e22;
  border-color: #1a1e22;
}

/* 强制统一按钮中文字字号，与主登录按钮一致 */
.github-button :deep(.van-button__text) {
  font-size: 16px;
  font-weight: 500;
}

.github-button svg {
  margin-right: 8px;
}
</style>

<template>
  <div class="auth-page">
    <div class="header">
      <h2>登录</h2>
    </div>
    
    <!-- 传统登录表单 -->
    <van-form @submit="onSubmit">
      <van-field v-model="form.username" name="username" label="用户名/邮箱" placeholder="请输入用户名或邮箱" :rules="[{ required: true, message: '请输入用户名或邮箱' }]" />
      <van-field v-model="form.password" name="password" type="password" label="密码" placeholder="请输入密码" :rules="[{ required: true, message: '请输入密码' }]" />
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit" :loading="loading" class="primary-login-button">登录</van-button>
      </div>
    </van-form>
    
    <!-- 分割线 -->
    <div class="divider">
      <span>或</span>
    </div>
    
    <!-- GitHub 登录（移动到下方） -->
    <GitHubLogin />
    <!-- Google 登录 -->
    <GoogleLogin />
    
    <div class="footer">
      还没有账号？<span class="link" @click="$router.push('/register')">去注册</span>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userApi } from '@/utils/api'
import { showToast } from 'vant'
import GitHubLogin from '@/components/GitHubLogin.vue'
import GoogleLogin from '@/components/GoogleLogin.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const onSubmit = async () => {
  try {
    loading.value = true
    const res = await userApi.login({ username: form.username, password: form.password })
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    showToast('登录成功')
    const redirect = route.query.redirect || '/'
    router.replace(redirect)
  } catch (e) {
    // 错误提示在拦截器里
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { padding: 24px; }
.header { text-align: center; margin-bottom: 16px; }
.footer { text-align: center; font-size: 14px; color: var(--text-light); }
.link { color: var(--primary-color); }

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #999;
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: #e5e5e5;
}

.divider span {
  padding: 0 16px;
  background-color: #f7f8fa;
}

/* 统一按钮文字字号，与 GitHub 按钮保持一致 */
.primary-login-button :deep(.van-button__text) {
  font-size: 16px;
  font-weight: 500;
}
</style>



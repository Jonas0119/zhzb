<template>
  <div class="auth-page">
    <div class="header">
      <h2>登录</h2>
    </div>
    <van-form @submit="onSubmit">
      <van-field v-model="form.username" name="username" label="用户名/邮箱" placeholder="请输入用户名或邮箱" :rules="[{ required: true, message: '请输入用户名或邮箱' }]" />
      <van-field v-model="form.password" name="password" type="password" label="密码" placeholder="请输入密码" :rules="[{ required: true, message: '请输入密码' }]" />
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit" :loading="loading">登录</van-button>
      </div>
    </van-form>
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
</style>



<template>
  <div class="google-login">
    <van-button 
      type="primary" 
      size="large" 
      block 
      :loading="loading"
      @click="handleGoogleLogin"
      class="google-button"
    >
      <template #icon>
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.153,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.153,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.191-5.238C29.211,35.091,26.715,36,24,36c-5.199,0-9.607-3.317-11.268-7.946l-6.5,5.017C9.539,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.236-2.231,4.166-3.994,5.57c0.001-0.001,0.002-0.001,0.003-0.002l6.191,5.238C35.27,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
      </template>
      使用 Google 登录
    </van-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/config/supabase'
import { showToast } from 'vant'

const loading = ref(false)

const handleGoogleLogin = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?provider=google`
      }
    })
    if (error) throw error
  } catch (e) {
    console.error('Google login error:', e)
    showToast('Google 登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.google-login { margin: 16px 0; }
.google-button { background: #ffffff; color: #333; border: 1px solid #ddd; }
.google-button svg { margin-right: 8px; }
</style>



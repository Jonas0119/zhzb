<template>
  <div id="app">
    <router-view />
    <SpeedInsights />
  </div>
</template>

<script setup>
// 应用根组件
import { SpeedInsights } from '@vercel/speed-insights/vue';
</script>

<style scoped>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
<template>
  <div class="layout">
    <van-nav-bar
      v-if="!route.meta?.showTabbar"
      :title="route.meta?.title"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="content" :class="{ 'with-tabbar': route.meta?.showTabbar }">
      <router-view />
    </div>

    <van-tabbar v-if="route.meta?.showTabbar" v-model="active" @change="onTabChange">
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="shop-o" to="/market">积分市场</van-tabbar-item>
      <van-tabbar-item icon="chat-o" to="/announcement">公告</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const active = ref(0)

// 根据当前路由设置底部导航激活状态
const tabRoutes = ['/', '/market', '/announcement', '/profile']
const currentTabIndex = computed(() => {
  return tabRoutes.indexOf(route.path)
})

if (currentTabIndex.value >= 0) {
  active.value = currentTabIndex.value
}

const onTabChange = (index) => {
  active.value = index
}
</script>

<style scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  overflow: auto;
  background-color: var(--background-color);
}

.content.with-tabbar {
  padding-bottom: 50px;
}

.van-nav-bar {
  --van-nav-bar-background: var(--primary-gradient);
  --van-nav-bar-title-text-color: white;
  --van-nav-bar-icon-color: white;
}
</style>
<template>
  <div class="announcement">
    <!-- Tab标签栏 -->
    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab title="官方公告" name="official">
        <div class="announcement-list">
          <div
            v-for="item in officialAnnouncements"
            :key="item.id"
            class="announcement-card"
            @click="goToDetail(item.id)"
          >
            <div class="card-header">
              <div class="title-row">
                <span v-if="item.isTop" class="top-badge">置顶</span>
                <span class="official-badge">官方公告</span>
                <h3 class="title">{{ item.title }}</h3>
              </div>
            </div>

            <div class="card-footer">
              <span class="publish-time">{{ item.publishTime }}</span>
              <span class="read-count">
                <van-icon name="eye-o" />
                {{ item.readCount }}
              </span>
            </div>
          </div>
        </div>
      </van-tab>

      <van-tab title="前沿资讯" name="news">
        <div class="announcement-list">
          <div
            v-for="item in newsAnnouncements"
            :key="item.id"
            class="announcement-card"
            @click="goToDetail(item.id)"
          >
            <div class="card-header">
              <div class="title-row">
                <span v-if="item.isTop" class="top-badge">置顶</span>
                <span class="news-badge">资讯</span>
                <h3 class="title">{{ item.title }}</h3>
              </div>
            </div>

            <div class="card-footer">
              <span class="publish-time">{{ item.publishTime }}</span>
              <span class="read-count">
                <van-icon name="eye-o" />
                {{ item.readCount }}
              </span>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 空状态 -->
    <div v-if="loading" class="skeleton"><van-skeleton title :row="6" /></div>
    <div v-else-if="error" class="empty-state"><van-empty description="加载失败"><van-button type="primary" size="small" @click="reload">重试</van-button></van-empty></div>
    <div v-else-if="currentList.length === 0" class="empty-state"><van-empty description="暂无公告" /></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAnnouncementStore } from '@/store/announcement'
import { useRouter } from 'vue-router'

const announcementStore = useAnnouncementStore()
const router = useRouter()

// 响应式数据
const activeTab = ref('official')
const loading = ref(false)
const error = ref(false)

// 计算属性
const officialAnnouncements = computed(() =>
  announcementStore.getAnnouncementsByType('official')
)

const newsAnnouncements = computed(() =>
  announcementStore.getAnnouncementsByType('news')
)

const currentList = computed(() =>
  activeTab.value === 'official' ? officialAnnouncements.value : newsAnnouncements.value
)

// 方法
const onTabChange = (name) => {
  activeTab.value = name
  announcementStore.setActiveTab(name)
}

const goToDetail = (id) => {
  router.push(`/announcement/${id}`)
}

const reload = async () => {
  try { error.value = false; loading.value = true; await announcementStore.fetchList() } catch(e) { error.value = true } finally { loading.value = false }
}

onMounted(reload)
</script>

<style scoped>
.announcement {
  min-height: 100vh;
  background-color: var(--background-color);
}

.van-tabs {
  --van-tabs-line-height: 44px;
  --van-tab-active-text-color: var(--primary-color);
  --van-tabs-bottom-bar-color: var(--primary-color);
}

.announcement-list {
  padding: 12px 16px;
}

.announcement-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s;
}

.announcement-card:active {
  transform: scale(0.98);
}

.card-header {
  margin-bottom: 12px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.top-badge {
  background: #FF4D4F;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.official-badge {
  background: linear-gradient(135deg, #722ED1, #1890FF);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-badge {
  background: var(--primary-color);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0;
  line-height: 1.4;
  flex: 1;
  /* 限制标题显示行数 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-light);
}

.read-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  padding: 60px 0;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .title {
    font-size: 14px;
  }

  .announcement-card {
    padding: 12px;
  }
}
</style>
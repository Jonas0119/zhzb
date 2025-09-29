<template>
  <div class="announcement-detail">
    <div v-if="!announcement" class="error-state">
      <van-empty description="公告不存在或已删除" />
    </div>

    <div v-else class="detail-container">
      <!-- 公告头部信息 -->
      <div class="detail-header">
        <div class="header-badges">
          <span v-if="announcement.isTop" class="top-badge">置顶</span>
          <span :class="getBadgeClass(announcement.type)">
            {{ announcement.type === 'official' ? '官方公告' : '前沿资讯' }}
          </span>
        </div>

        <h1 class="detail-title">{{ announcement.title }}</h1>

        <div class="detail-meta">
          <span class="publish-time">{{ announcement.publishTime }}</span>
          <span class="read-count">
            <van-icon name="eye-o" />
            阅读 {{ announcement.readCount }}
          </span>
        </div>
      </div>

      <!-- 公告内容 -->
      <div class="detail-content">
        <div class="content-wrapper" v-html="announcement.content"></div>
      </div>

      <!-- 操作按钮 -->
      <div class="detail-actions">
        <van-button type="default" @click="$router.back()">
          返回列表
        </van-button>
        <van-button type="primary" @click="shareAnnouncement">
          分享公告
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnnouncementStore } from '@/store/announcement'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const announcementStore = useAnnouncementStore()

// 响应式数据
const announcement = ref(null)

// 方法
const getBadgeClass = (type) => {
  return type === 'official' ? 'official-badge' : 'news-badge'
}

const shareAnnouncement = () => {
  // 模拟分享功能
  if (navigator.share) {
    navigator.share({
      title: announcement.value.title,
      text: announcement.value.title,
      url: window.location.href
    }).catch(() => {
      showToast('分享失败')
    })
  } else {
    // 降级处理：复制链接到剪贴板
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('链接已复制到剪贴板')
      }).catch(() => {
        showToast('分享失败')
      })
    } else {
      showToast('当前浏览器不支持分享功能')
    }
  }
}

// 生命周期
onMounted(async () => {
  const announcementId = route.params.id
  announcement.value = await announcementStore.fetchDetail(announcementId)
})
</script>

<style scoped>
.announcement-detail {
  min-height: 100vh;
  background-color: var(--background-color);
}

.error-state {
  padding: 60px 0;
}

.detail-container {
  background: white;
  min-height: 100vh;
}

.detail-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--border-color);
}

.header-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.top-badge {
  background: #FF4D4F;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.official-badge {
  background: linear-gradient(135deg, #722ED1, #1890FF);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.news-badge {
  background: var(--primary-color);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.detail-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  margin: 0 0 12px;
  line-height: 1.4;
}

.detail-meta {
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

.detail-content {
  padding: 20px 16px;
  min-height: 60vh;
}

.content-wrapper {
  line-height: 1.8;
  font-size: 16px;
  color: var(--text-color);
}

/* 内容样式 */
.content-wrapper :deep(h3) {
  color: var(--text-color);
  font-size: 18px;
  margin: 20px 0 12px;
}

.content-wrapper :deep(h4) {
  color: var(--text-color);
  font-size: 16px;
  margin: 16px 0 8px;
}

.content-wrapper :deep(p) {
  margin: 12px 0;
  text-align: justify;
}

.content-wrapper :deep(ul) {
  margin: 12px 0;
  padding-left: 20px;
}

.content-wrapper :deep(li) {
  margin: 8px 0;
  list-style-type: disc;
}

.content-wrapper :deep(strong) {
  font-weight: bold;
  color: var(--text-color);
}

.detail-actions {
  padding: 20px 16px;
  display: flex;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  background: white;
  position: sticky;
  bottom: 0;
}

.detail-actions .van-button {
  flex: 1;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .detail-title {
    font-size: 18px;
  }

  .content-wrapper {
    font-size: 15px;
  }

  .detail-header {
    padding: 16px 12px;
  }

  .detail-content {
    padding: 16px 12px;
  }

  .detail-actions {
    padding: 16px 12px;
  }
}
</style>
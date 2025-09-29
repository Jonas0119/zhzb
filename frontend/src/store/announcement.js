import { defineStore } from 'pinia'
import { announcementApi } from '@/utils/api'

export const useAnnouncementStore = defineStore('announcement', {
  state: () => ({
    announcements: [],
    activeTab: 'official'
  }),

  getters: {
    getAnnouncementsByType: (state) => (type) => {
      if (type === 'all') return state.announcements
      return state.announcements.filter(item => item.type === type)
    },

    // 获取公告统计
    getAnnouncementStats: (state) => {
      const official = state.announcements.filter(item => item.type === 'official').length
      const news = state.announcements.filter(item => item.type === 'news').length
      return { official, news, total: official + news }
    }
  },

  actions: {
    setActiveTab(tab) { this.activeTab = tab },

    async fetchList() {
      const list = await announcementApi.getList()
      // 统一映射到前端使用的字段：publishTime/readCount/type
      this.announcements = list.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type === 'system' ? 'official' : (item.type === 'notice' ? 'official' : 'news'),
        publishTime: new Date(item.createdAt).toLocaleString('zh-CN'),
        readCount: item.viewCount || 0,
        isTop: !!item.isImportant
      }))
      return this.announcements
    },

    async fetchDetail(id) {
      const item = await announcementApi.getDetail(id)
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type === 'system' ? 'official' : (item.type === 'notice' ? 'official' : 'news'),
        publishTime: new Date(item.createdAt).toLocaleString('zh-CN'),
        readCount: item.viewCount || 0,
        isTop: !!item.isImportant
      }
    }
  }
})
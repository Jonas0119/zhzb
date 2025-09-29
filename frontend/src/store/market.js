import { defineStore } from 'pinia'
import { marketApi } from '@/utils/api'

export const useMarketStore = defineStore('market', {
  state: () => ({
    // 市场订单数据
    sellOrders: [],

    // 买单数据(可以为空，因为是即时交易)
    buyOrders: [],

    // 筛选和排序条件
    filters: {
      pointType: '', // 'AIC' | 'HH' | ''
      priceRange: [0, 999999],
      amountRange: [0, 999999]
    },

    sortBy: 'createdAt', // 'price' | 'amount' | 'createdAt'
    sortOrder: 'desc' // 'asc' | 'desc'
  }),

  getters: {
    // 过滤后的卖单
    filteredSellOrders: (state) => {
      let orders = state.sellOrders.filter(order => {
        // 积分类型过滤
        if (state.filters.pointType && order.pointType !== state.filters.pointType) {
          return false
        }

        // 价格范围过滤
        if (order.unitPrice < state.filters.priceRange[0] ||
            order.unitPrice > state.filters.priceRange[1]) {
          return false
        }

        // 数量范围过滤
        if (order.remainingAmount < state.filters.amountRange[0] ||
            order.remainingAmount > state.filters.amountRange[1]) {
          return false
        }

        return order.status === 'active'
      })

      // 排序
      orders.sort((a, b) => {
        let aValue, bValue

        switch (state.sortBy) {
          case 'price':
            aValue = a.unitPrice
            bValue = b.unitPrice
            break
          case 'amount':
            aValue = a.remainingAmount
            bValue = b.remainingAmount
            break
          default:
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
        }

        return state.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      })

      return orders
    },

    // 获取积分类型统计
    pointTypeStats: (state) => {
      const stats = { AIC: 0, HH: 0 }
      console.log('Calculating stats for orders:', state.sellOrders)
      console.log('Orders length in getter:', state.sellOrders.length)
      
      if (Array.isArray(state.sellOrders)) {
        state.sellOrders.forEach(order => {
          console.log('Processing order:', order)
          if (order.status === 'active' && order.pointType) {
            stats[order.pointType] = (stats[order.pointType] || 0) + 1
          }
        })
      }
      
      console.log('Calculated stats:', stats)
      return stats
    }
  },

  actions: {
    // 设置筛选条件
    setFilter(key, value) {
      this.filters[key] = value
    },

    // 设置排序
    setSorting(sortBy, sortOrder) {
      this.sortBy = sortBy
      this.sortOrder = sortOrder
    },

    // 清除所有筛选条件
    clearFilters() {
      this.filters = {
        pointType: '',
        priceRange: [0, 999999],
        amountRange: [0, 999999]
      }
    },

    async fetchOrders(params = {}) {
      try {
        console.log('Fetching orders with params:', params)
        const list = await marketApi.getOrders(params)
        console.log('API returned orders:', list)
        console.log('Orders length:', list.length)
        
        // 确保数据格式正确
        const processedOrders = Array.isArray(list) ? list.map(order => ({
          id: order.id,
          pointType: order.pointType,
          status: order.status,
          sellerName: order.sellerName,
          unitPrice: Number(order.unitPrice),
          remainingAmount: Number(order.remainingAmount),
          totalPrice: Number(order.totalPrice),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        })) : []
        
        // 使用Vue的响应式更新
        this.sellOrders = processedOrders
        console.log('Store sellOrders after update:', this.sellOrders)
        console.log('Store sellOrders length:', this.sellOrders.length)
        return processedOrders
      } catch (error) {
        console.error('Error fetching orders:', error)
        throw error
      }
    },

    async addSellOrder(orderData) {
      const created = await marketApi.createSellOrder(orderData)
      this.sellOrders.unshift(created)
      return created
    },

    async buyPoints(orderId, amount) {
      const res = await marketApi.buyPoints(orderId, { amount })
      // 同步本地余量
      const order = this.sellOrders.find(o => o.id === orderId)
      if (order) {
        order.remainingAmount = res.remainingAmount
        if (res.remainingAmount === 0) order.status = 'completed'
      }
      return { success: true, totalCost: res.cost, fee: res.fee }
    },

    async cancelSellOrder(orderId) {
      await marketApi.cancelOrder(orderId)
      const order = this.sellOrders.find(o => o.id === orderId)
      if (order) order.status = 'cancelled'
      return { success: true }
    },

    getOrderById(orderId) {
      return this.sellOrders.find(o => o.id === parseInt(orderId))
    },

    // 强制刷新数据
    async refreshOrders() {
      try {
        console.log('Force refreshing orders...')
        const orders = await this.fetchOrders()
        console.log('Refresh completed, orders:', orders)
        return orders
      } catch (error) {
        console.error('Failed to refresh orders:', error)
        throw error
      }
    }
  }
})
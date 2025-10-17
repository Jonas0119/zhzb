import { defineStore } from 'pinia'
import { userApi } from '@/utils/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    // 用户基本信息
    userInfo: {
      id: 'e463147c',
      username: '用户e463147c',
      phone: '13800138000',
      avatar: '',
      role: 'user'
    },

    // 积分余额
    points: {
      AIC: 1000.0000,
      HH: 1000.0000
    },

    // 冻结积分
    frozenPoints: {
      AIC: 0.0000,
      HH: 0.0000
    },

    // 钱包余额
    wallet: {
      balance: 10000.00,
      frozenBalance: 0.00
    },

    // 银行卡信息
    bankCards: [
      {
        id: 1,
        cardNumber: '**** **** **** 1234',
        bankName: '中国银行',
        isDefault: true
      }
    ],

    // 我的订单
    myOrders: [
      {
        id: 1,
        type: 'sell',
        pointType: 'AIC',
        amount: 1000,
        unitPrice: 10.00,
        totalPrice: 10000.00,
        remainingAmount: 500,
        status: 'active',
        createdAt: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        type: 'buy',
        pointType: 'HH',
        amount: 200,
        unitPrice: 15.00,
        totalPrice: 3000.00,
        status: 'completed',
        createdAt: '2024-01-14 15:20:00'
      }
    ]
  }),

  getters: {
    // 可用积分总额
    totalAvailablePoints: (state) => {
      return state.points.AIC + state.points.HH
    },

    // 冻结积分总额
    totalFrozenPoints: (state) => {
      return state.frozenPoints.AIC + state.frozenPoints.HH
    },

    // 钱包总额
    totalWalletBalance: (state) => {
      return state.wallet.balance + state.wallet.frozenBalance
    },

    // 活跃订单数量
    activeOrdersCount: (state) => {
      return state.myOrders.filter(order => order.status === 'active').length
    }
  },

  actions: {
    // 登录
    async login(payload) {
      const res = await userApi.login(payload)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      this.userInfo = {
        id: res.user.id,
        username: res.user.username,
        phone: res.user.phone || '',
        avatar: '',
        role: res.user.role || 'user'
      }
      // 可从后端加载余额/积分，这里保持现有结构，后续替换为接口
      return res
    },

    // 注册
    async register(payload) {
      const res = await userApi.register(payload)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      this.userInfo = {
        id: res.user.id,
        username: res.user.username,
        phone: res.user.phone || '',
        avatar: '',
        role: res.user.role || 'user'
      }
      return res
    },

    // 拉取用户信息
    async fetchProfile() {
      const user = await userApi.getProfile()
      this.userInfo = {
        id: user.id,
        username: user.username,
        phone: user.phone || '',
        avatar: '',
        role: user.role || 'user'
      }
      return user
    },
    // 更新积分
    updatePoints(pointType, amount) {
      if (this.points[pointType] !== undefined) {
        this.points[pointType] = Math.max(0, this.points[pointType] + amount)
      }
    },

    // 冻结积分
    freezePoints(pointType, amount) {
      if (this.points[pointType] >= amount) {
        this.points[pointType] -= amount
        this.frozenPoints[pointType] += amount
        return true
      }
      return false
    },

    // 解冻积分
    unfreezePoints(pointType, amount) {
      if (this.frozenPoints[pointType] >= amount) {
        this.frozenPoints[pointType] -= amount
        this.points[pointType] += amount
        return true
      }
      return false
    },

    // 更新钱包余额
    updateWalletBalance(amount) {
      this.wallet.balance = Math.max(0, this.wallet.balance + amount)
    },

    // 冻结余额
    freezeBalance(amount) {
      if (this.wallet.balance >= amount) {
        this.wallet.balance -= amount
        this.wallet.frozenBalance += amount
        return true
      }
      return false
    },

    // 解冻余额
    unfreezeBalance(amount) {
      if (this.wallet.frozenBalance >= amount) {
        this.wallet.frozenBalance -= amount
        this.wallet.balance += amount
        return true
      }
      return false
    },

    // 添加订单
    addOrder(order) {
      this.myOrders.unshift({
        ...order,
        id: Date.now(),
        createdAt: new Date().toLocaleString('zh-CN')
      })
    },

    // 更新订单状态
    updateOrderStatus(orderId, status) {
      const order = this.myOrders.find(o => o.id === orderId)
      if (order) {
        order.status = status
      }
    },

    // 添加银行卡
    addBankCard(cardInfo) {
      this.bankCards.push({
        ...cardInfo,
        id: Date.now(),
        isDefault: this.bankCards.length === 0
      })
    }
    ,

    // 拉取钱包信息（真实 API）
    async fetchWalletInfo() {
      const { walletApi } = await import('@/utils/api')
      const info = await walletApi.getInfo()
      this.wallet.balance = Number(info.balance)
      this.wallet.frozenBalance = Number(info.frozenBalance)
      this.points.AIC = Number(info.points.AIC)
      this.points.HH = Number(info.points.HH)
      this.frozenPoints.AIC = Number(info.frozenPoints.AIC)
      this.frozenPoints.HH = Number(info.frozenPoints.HH)
      return info
    },

    // 充值（使用productId）
    async recharge(productId) {
      const res = await (await import('@/utils/api')).walletApi.recharge({ productId })
      // 如果返回了checkoutUrl，说明需要跳转到支付页面
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
        return res
      }
      // 否则直接更新余额（模拟充值）
      this.wallet.balance = res.balance
      return res
    },

    // 获取银行卡列表（真实 API）
    async fetchBankCards() {
      const list = await (await import('@/utils/api')).walletApi.getBankCards()
      this.bankCards = list.map(card => ({
        id: card.id,
        cardNumber: `**** **** **** ${card.cardNumber.slice(-4)}`,
        bankName: card.bankName,
        isDefault: card.isDefault
      }))
      return this.bankCards
    },

    // 添加银行卡（真实 API）
    async bindBankCard(payload) {
      const card = await (await import('@/utils/api')).walletApi.addBankCard(payload)
      
      // 如果已有银行卡，替换现有卡片；否则添加新卡片
      if (this.bankCards.length > 0) {
        // 替换现有卡片
        this.bankCards[0] = {
          id: card.id,
          cardNumber: `**** **** **** ${card.cardNumber.slice(-4)}`,
          bankName: card.bankName,
          holderName: card.holderName,
          isDefault: card.isDefault
        }
      } else {
        // 添加新卡片
        this.bankCards.unshift({
          id: card.id,
          cardNumber: `**** **** **** ${card.cardNumber.slice(-4)}`,
          bankName: card.bankName,
          holderName: card.holderName,
          isDefault: card.isDefault
        })
      }
      return card
    },

    // 删除银行卡（真实 API）
    async removeBankCard(id) {
      await (await import('@/utils/api')).walletApi.deleteBankCard(id)
      this.bankCards = this.bankCards.filter(c => c.id !== id)
      return true
    }
  }
})
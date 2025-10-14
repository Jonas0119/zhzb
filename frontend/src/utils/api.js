import axios from 'axios'
import { showToast } from 'vant'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { data } = response
    // 后端直接返回数据，不需要检查success字段
    return data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        // 检查错误消息来区分不同类型的401错误
        if (data?.message === '账号或密码错误') {
          // 账号或密码错误，不清除token
          showToast('账号或密码错误')
        } else {
          // token过期或无效，清除本地存储并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          showToast('登录已过期，请重新登录')
          // 这里可以跳转到登录页，但由于是demo，暂时不实现
        }
      } else {
        showToast(data?.message || error.message || '网络错误')
      }
    } else {
      showToast('网络连接失败')
    }
    return Promise.reject(error)
  }
)

// API方法
export const userApi = {
  // 用户注册
  register: (data) => api.post('/auth/register', data),

  // 用户登录
  login: (data) => api.post('/auth/login', data),

  // GitHub 登录
  githubLogin: (data) => api.post('/auth/github-login', data),

  // Google 登录
  googleLogin: (data) => api.post('/auth/google-login', data),

  // 获取用户信息
  getProfile: () => api.get('/auth/profile'),

  // 更新用户信息
  updateProfile: (data) => api.put('/user/profile', data),

  // 修改密码
  changePassword: (data) => api.post('/user/change-password', data),

  // 获取积分信息
  getPoints: () => api.get('/user/points'),

  // 获取用户订单
  getOrders: () => api.get('/user/orders'),

  // 添加银行卡
  addBankCard: (data) => api.post('/user/bank-card', data)
}

export const marketApi = {
  // 获取市场订单列表
  getOrders: (params) => api.get('/market/orders', { params }),

  // 获取订单详情
  getOrderDetail: (id) => api.get(`/market/orders/${id}`),

  // 发布卖单
  createSellOrder: (data) => api.post('/market/sell', data),

  // 购买积分
  buyPoints: (id, data) => api.post(`/market/buy/${id}`, data),

  // 取消订单
  cancelOrder: (id) => api.delete(`/market/orders/${id}`),

  // 获取用户卖单
  getUserOrders: () => api.get('/market/my-orders'),

  // 评价订单
  reviewOrder: (id, data) => api.post(`/market/orders/${id}/review`, data)
}

export const walletApi = {
  // 获取钱包信息
  getInfo: () => api.get('/wallet/info'),

  // 充值
  recharge: (data) => api.post('/wallet/recharge', data),

  // 提现
  withdraw: (data) => api.post('/wallet/withdraw', data),

  // 获取交易记录
  getTransactions: (params) => api.get('/wallet/transactions', { params }),

  // 获取银行卡列表
  getBankCards: () => api.get('/wallet/bank-cards'),

  // 添加银行卡
  addBankCard: (data) => api.post('/wallet/bank-card', data),

  // 删除银行卡
  deleteBankCard: (id) => api.delete(`/wallet/bank-cards/${id}`)
}

export const announcementApi = {
  // 获取公告列表
  getList: (params) => api.get('/announcements', { params }),

  // 获取公告详情
  getDetail: (id) => api.get(`/announcements/${id}`)
}

export const adminApi = {
  // 获取数据看板
  getDashboard: () => api.get('/admin/dashboard'),
  
  // 获取用户列表
  getUsers: (params) => api.get('/admin/users', { params }),
  
  // 给用户增加积分
  addUserPoints: (userId, data) => api.post(`/admin/users/${userId}/add-points`, data),
  
  // 修改用户权限
  updateUserRole: (userId, data) => api.post(`/admin/users/${userId}/update-role`, data),
  
  // 获取操作日志
  getLogs: (params) => api.get('/admin/logs', { params })
}

export const systemApi = {
  // 健康检查
  health: () => api.get('/health')
}

export default api
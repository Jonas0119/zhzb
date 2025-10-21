import axios from 'axios'
import { showToast, showNotify } from 'vant'

// 错误码映射表 - 提供更友好的错误提示
const ERROR_CODE_MAP = {
  // 通用错误
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'TIMEOUT': '请求超时，请稍后重试',
  'INTERNAL_ERROR': '服务器内部错误，请稍后重试',
  
  // 认证相关
  'INVALID_CREDENTIALS': '账号或密码错误',
  'TOKEN_EXPIRED': '登录已过期，请重新登录',
  'UNAUTHORIZED': '未授权，请先登录',
  'FORBIDDEN': '没有权限访问该资源',
  
  // 用户相关
  'USER_NOT_FOUND': '用户不存在',
  'USER_EXISTS': '用户名已存在',
  'EMAIL_EXISTS': '邮箱已被注册',
  
  // 积分相关
  'INSUFFICIENT_POINTS': '积分不足',
  'INSUFFICIENT_BALANCE': '余额不足',
  'INVALID_POINT_TYPE': '无效的积分类型',
  
  // 订单相关
  'ORDER_NOT_FOUND': '订单不存在',
  'ORDER_COMPLETED': '订单已完成',
  'ORDER_CANCELLED': '订单已取消',
  'ORDER_NOT_AVAILABLE': '订单不可购买',
  'INSUFFICIENT_AMOUNT': '订单剩余数量不足',
  'INVALID_ORDER_STATUS': '订单状态不正确',
  'UNAUTHORIZED_ORDER': '无权操作该订单',
  
  // 银行卡相关
  'CARD_NOT_FOUND': '银行卡不存在',
  'INVALID_CARD': '无效的银行卡信息',
  
  // 交易相关
  'TRANSACTION_FAILED': '交易失败，请重试',
  'DOUBLE_SPENDING': '请勿重复提交',
  
  // 验证相关
  'VALIDATION_ERROR': '数据验证失败',
  'INVALID_PARAMS': '参数错误',
  'MISSING_PARAMS': '缺少必要参数'
}

// 根据HTTP状态码返回友好提示
const getStatusMessage = (status) => {
  const statusMap = {
    400: '请求参数错误',
    401: '未授权，请先登录',
    403: '没有权限访问',
    404: '请求的资源不存在',
    500: '服务器错误，请稍后重试',
    502: '网关错误',
    503: '服务暂时不可用',
    504: '网关超时'
  }
  return statusMap[status] || '请求失败'
}

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
    showToast('请求发送失败')
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
    console.error('API错误:', error)
    
    // 请求超时
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      showToast(ERROR_CODE_MAP['TIMEOUT'])
      return Promise.reject(error)
    }
    
    // 网络错误
    if (!error.response) {
      showToast(ERROR_CODE_MAP['NETWORK_ERROR'])
      return Promise.reject(error)
    }
    
    const { status, data } = error.response
    let message = ''
    
    // 处理特殊状态码
    if (status === 401) {
      // 检查是否是登录失败（账号密码错误）
      if (data?.message?.includes('账号或密码错误') || 
          data?.message?.includes('密码') || 
          data?.message?.includes('用户名')) {
        message = ERROR_CODE_MAP['INVALID_CREDENTIALS']
      } else {
        // token过期或无效
        message = ERROR_CODE_MAP['TOKEN_EXPIRED']
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // 延迟跳转到登录页，给用户看到提示的时间
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }, 1500)
      }
    } else {
      // 尝试从后端返回的错误码获取友好提示
      const errorCode = data?.code || data?.errorCode
      if (errorCode && ERROR_CODE_MAP[errorCode]) {
        message = ERROR_CODE_MAP[errorCode]
      } else {
        // 使用后端返回的错误信息
        message = data?.message || getStatusMessage(status)
      }
    }
    
    // 显示错误提示
    if (status >= 500) {
      // 服务器错误用notify显示，更醒目
      showNotify({ type: 'danger', message, duration: 3000 })
    } else {
      showToast(message)
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

  // 获取充值产品列表
  getRechargeProducts: () => api.get('/wallet/recharge-products'),

  // 充值（使用productId）
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
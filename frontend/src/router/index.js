import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页', showTabbar: true }
      },
      {
        path: '/market',
        name: 'Market',
        component: () => import('@/views/Market.vue'),
        meta: { title: '积分市场', showTabbar: true }
      },
      {
        path: '/announcement',
        name: 'Announcement',
        component: () => import('@/views/Announcement.vue'),
        meta: { title: '公告', showTabbar: true }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '我的', showTabbar: true }
      },
      {
        path: '/wallet',
        name: 'Wallet',
        component: () => import('@/views/Wallet.vue'),
        meta: { title: '我的钱包', showTabbar: false }
      },
      {
        path: '/sell',
        name: 'Sell',
        component: () => import('@/views/Sell.vue'),
        meta: { title: '发布卖单', showTabbar: false }
      },
      {
        path: '/buy/:id',
        name: 'Buy',
        component: () => import('@/views/Buy.vue'),
        meta: { title: '购买积分', showTabbar: false }
      },
      {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '我的订单', showTabbar: false }
      },
      {
        path: '/announcement/:id',
        name: 'AnnouncementDetail',
        component: () => import('@/views/AnnouncementDetail.vue'),
        meta: { title: '公告详情', showTabbar: false }
      },
      {
        path: '/recharge',
        name: 'Recharge',
        component: () => import('@/views/Recharge.vue'),
        meta: { title: '充值', showTabbar: false }
      },
      {
        path: '/bind-card',
        name: 'BindCard',
        component: () => import('@/views/BindCard.vue'),
        meta: { title: '绑定银行卡', showTabbar: false }
      },
      {
        path: '/orders/pending-payment',
        name: 'PendingPayment',
        component: () => import('@/views/PendingPayment.vue'),
        meta: { title: '待付款', showTabbar: false }
      },
      {
        path: '/orders/pending-review',
        name: 'PendingReview',
        component: () => import('@/views/PendingReview.vue'),
        meta: { title: '待评价', showTabbar: false }
      },
      {
        path: '/orders/completed',
        name: 'CompletedOrders',
        component: () => import('@/views/CompletedOrders.vue'),
        meta: { title: '已完成', showTabbar: false }
      },
      {
        path: '/order/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetail.vue'),
        meta: { title: '订单详情', showTabbar: false }
      },
      // 管理员路由
      {
        path: '/admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '数据看板', showTabbar: false, requiresAdmin: true }
      },
      {
        path: '/admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理', showTabbar: false, requiresAdmin: true }
      },
      {
        path: '/admin/points',
        name: 'AdminPoints',
        component: () => import('@/views/admin/Points.vue'),
        meta: { title: '积分管理', showTabbar: false, requiresAdmin: true }
      },
      {
        path: '/admin/logs',
        name: 'AdminLogs',
        component: () => import('@/views/admin/Logs.vue'),
        meta: { title: '操作日志', showTabbar: false, requiresAdmin: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', showTabbar: false, public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', showTabbar: false, public: true }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/views/AuthCallback.vue'),
    meta: { title: '登录中', showTabbar: false, public: true }
  },
  {
    path: '/recharge-callback',
    name: 'RechargeCallback',
    component: () => import('@/views/RechargeCallback.vue'),
    meta: { 
      title: '支付结果', 
      showTabbar: false, 
      public: true  // 添加public标记，跳过登录检查
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：需要登录的页面检查 token
router.beforeEach((to, from, next) => {
  if (to.meta.public) return next()
  
  const token = localStorage.getItem('token')
  if (!token) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  
  // 检查管理员权限
  if (to.meta.requiresAdmin) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') {
      return next({ name: 'Profile' })
    }
  }
  
  next()
})

export default router
# 智慧账簿前端项目

基于Vue 3 + Vant UI开发的移动端H5应用

## 项目结构

```
src/
├── components/          # 公共组件
│   └── Layout.vue      # 主布局组件
├── views/              # 页面组件
│   ├── Home.vue        # 首页
│   ├── Market.vue      # 积分市场
│   ├── Sell.vue        # 发布卖单
│   ├── Buy.vue         # 购买积分
│   ├── Orders.vue      # 我的订单
│   ├── Announcement.vue # 公告列表
│   ├── AnnouncementDetail.vue # 公告详情
│   ├── Profile.vue     # 个人中心
│   ├── Wallet.vue      # 我的钱包
│   ├── Recharge.vue    # 充值
│   └── BindCard.vue    # 绑定银行卡
├── router/             # 路由配置
│   └── index.js
├── store/              # 状态管理
│   ├── user.js         # 用户状态
│   ├── market.js       # 市场数据
│   └── announcement.js # 公告数据
├── assets/             # 静态资源
│   └── styles/
│       └── global.css  # 全局样式
└── main.js             # 入口文件
```

## 主要功能

- ✅ 首页积分展示和功能导航
- ✅ 积分市场交易（买卖积分）
- ✅ 公告系统（官方公告和资讯）
- ✅ 个人中心（用户信息和功能入口）
- ✅ 钱包管理（余额查看、充值、交易记录）
- ✅ 订单管理（买卖订单查看和操作）
- ✅ 银行卡绑定（演示功能）

## 技术栈

- Vue 3 (Composition API)
- Vant UI (移动端组件库)
- Vue Router 4
- Pinia (状态管理)
- Vite (构建工具)

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 设计规范

- 主色调：橙色系 (#FF7F50)
- 响应式设计，适配移动端
- 卡片式布局，圆角设计
- 一致的用户交互体验

## 功能特色

1. **完整的积分交易流程**
   - 发布卖单（积分冻结）
   - 购买积分（余额扣除）
   - 订单管理（取消、查看）

2. **模拟支付系统**
   - 无需真实支付接口
   - 即时到账和状态更新
   - 完整的交易记录

3. **用户友好的界面**
   - 移动端优化设计
   - 直观的操作反馈
   - 完善的错误处理

## 注意事项

- 所有数据均为Mock数据，仅供演示使用
- 支付功能为模拟功能，不涉及真实资金
- 银行卡绑定为演示功能，不进行真实验证
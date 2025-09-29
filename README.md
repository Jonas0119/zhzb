# 智慧账簿（前后端一体化说明）

## 项目概述
- 前端：Vue 3 + Vite + Vant + Pinia（H5 移动端）
- 后端：NestJS + TypeORM + MySQL（Docker）
- 主要功能：认证、公告、积分市场、钱包、积分管理、管理员统计
- 主题色：橙色系（#FF7F50）

## 目录结构
```
frontend/  # H5 前端
backend/   # NestJS 后端
PRD.md     # 需求文档
```

## TODO（进度汇总）
- [x] MySQL 初始化与连接（容器 mysql572，root/Tjfae@123）
- [x] 后端：TypeORM/Config/全局校验/审计日志/限流
- [x] 后端：认证、公告、市场、钱包、积分、管理员统计
- [x] 前端：登录注册与守卫、公告/市场/钱包对接、骨架屏/错误重试
- [x] 前端：Vite 代理与 baseURL 统一（/api）
- [x] 文档：运行说明、API 索引、调试指南

## 一键运行
### 后端（默认端口 3000）
```bash
cd backend
npm install
npm run start:dev
```
环境变量示例（backend/.env）：
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=Tjfae@123
DB_NAME=zhzb
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d
RATE_LIMIT_PER_MIN=60
```
数据库初始化（如需）：
```bash
docker exec -i mysql572 mysql -h127.0.0.1 -uroot -p'Tjfae@123' < ./database-init.sql
```

### 前端（开发端口 3000，已配置代理 /api → 后端 3000）
```bash
cd frontend
npm install
npm run dev
```

## API 快速索引
- 认证
  - POST /api/auth/register
  - POST /api/auth/login
  - GET  /api/auth/profile
- 公告
  - GET  /api/announcements
  - GET  /api/announcements/:id
- 市场
  - GET  /api/market/orders
  - POST /api/market/sell
  - POST /api/market/buy/:id
  - GET  /api/market/my-orders
  - DELETE /api/market/orders/:id
- 钱包
  - GET  /api/wallet/info
  - POST /api/wallet/recharge
  - GET  /api/wallet/transactions
  - GET  /api/wallet/bank-cards
  - POST /api/wallet/bank-card
  - DELETE /api/wallet/bank-cards/:id
- 积分
  - GET  /api/points/balance
  - POST /api/points/add/:userId
- 管理员
  - GET  /api/admin/statistics

## 调试指南
- 验证数据库：
```bash
docker exec -it mysql572 mysql -h127.0.0.1 -uroot -p'Tjfae@123' -e "SHOW DATABASES;"
```
- 常见问题：
  - 401：检查前端 token 是否存在/有效
  - 网络：确认后端 3000、Vite 代理和 Docker 映射
  - SQL：确认 .env 连接与 database-init.sql 是否执行

## 设计规范（节选）
- 色彩：橙色系主题（#FF7F50），卡片圆角 8px
- 交互：骨架屏、加载态、失败重试、Tab 高亮

---
后续所有文档（变更记录、二次开发说明、API 更新）统一维护于本 README。

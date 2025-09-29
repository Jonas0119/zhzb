# 🚀 Vercel部署快速指南

## 📋 两种部署方式

### 🎯 方式一：Monorepo一键部署 ⭐ (推荐)

```bash
# 1. 数据库准备
在Neon执行: database-init-postgres.sql

# 2. Vercel设置
Root Directory: / (根目录)
Framework: Other
Build Command: npm run build:all
Install Command: npm run install:all

# 3. 环境变量
NODE_ENV=production
DATABASE_URL=your_neon_database_url
JWT_SECRET=zhzb_jwt_secret_key_2024_nestjs
JWT_EXPIRE_TIME=7d
CORS_ORIGIN=*
VERCEL=1
VITE_API_BASE_URL=/api
```

**优势**: 一次部署，同域名，无跨域问题，成本更低

### 🔄 方式二：分离部署

#### 后端部署
```bash
Root Directory: backend
Framework: Other
Build Command: npm run vercel-build
Output Directory: dist

环境变量:
NODE_ENV=production
DATABASE_URL=your_neon_database_url
JWT_SECRET=zhzb_jwt_secret_key_2024_nestjs
JWT_EXPIRE_TIME=7d
CORS_ORIGIN=*
VERCEL=1
```

#### 前端部署
```bash
Root Directory: frontend
Framework: Vite
Build Command: npm run build
Output Directory: dist

环境变量:
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
```

## 📁 项目文件结构
```
zhzb/
├── package.json               # Monorepo统一构建
├── vercel.json                # 统一部署配置
├── frontend/vercel.json       # 独立前端配置
├── backend/vercel.json        # 独立后端配置
├── MONOREPO_DEPLOY.md         # Monorepo详细指南
└── DEPLOYMENT.md              # 分离部署详细指南
```

## ⚠️ 重要提醒
- **Monorepo模式**: 选择根目录 `/`，使用统一配置
- **分离模式**: 分别选择 `frontend` 和 `backend` 目录
- 前端环境变量必须以 `VITE_` 开头
- 确保数据库已初始化

**推荐使用Monorepo一键部署！** 🎉

详细说明：
- Monorepo部署: `MONOREPO_DEPLOY.md`
- 分离部署: `DEPLOYMENT.md`
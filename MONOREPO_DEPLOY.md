# 🚀 Vercel一键部署指南 (Monorepo)

## 项目概述
这是一个使用Monorepo架构的全栈应用，支持一次性部署前后端：
- **前端**: Vue3 + Vite + Vant UI
- **后端**: NestJS + TypeORM + PostgreSQL
- **数据库**: Neon Serverless Postgres

## 📁 Monorepo项目结构
```
zhzb/
├── package.json             # 根目录包管理和构建脚本
├── vercel.json              # 统一Vercel配置
├── frontend/                # Vue3 前端项目
│   ├── src/
│   ├── package.json
│   └── vercel.json          # 备用：独立部署配置
├── backend/                 # NestJS 后端项目
│   ├── src/
│   ├── package.json
│   └── vercel.json          # 备用：独立部署配置
└── database-init-postgres.sql
```

## 🎯 两种部署方式

### 方式一：Monorepo统一部署 ⭐ (推荐)

**步骤1: 数据库初始化**
在Neon控制台执行 `database-init-postgres.sql` 脚本

**步骤2: 一键部署**
1. 登录Vercel Dashboard
2. 点击 "New Project"
3. 选择GitHub仓库
4. **Root Directory**: 保持根目录 `/`（不要选择子目录）
5. Framework Preset: "Other"

**步骤3: 配置构建设置**
```bash
Build Command: npm run build:all
Install Command: npm run install:all
Output Directory: (留空)
```

**步骤4: 配置环境变量**
```bash
# 后端环境变量
NODE_ENV=production
DATABASE_URL=your_neon_database_url
JWT_SECRET=zhzb_jwt_secret_key_2024_nestjs
JWT_EXPIRE_TIME=7d
CORS_ORIGIN=*
VERCEL=1

# 前端环境变量
VITE_API_BASE_URL=/api
```

**步骤5: 部署**
点击Deploy，Vercel会自动：
1. 安装所有依赖
2. 构建后端和前端
3. 配置路由规则
4. 部署到同一个域名

### 方式二：分离部署

如果需要前后端独立部署，请参考 `DEPLOYMENT.md` 中的详细说明。

## 🔧 Monorepo配置详解

### 根目录 `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/dist/main.js",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb"
      }
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/dist/main.js"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/index.html"
    }
  ],
  "buildCommand": "npm run build:all",
  "installCommand": "npm run install:all"
}
```

### 根目录 `package.json` 脚本
```json
{
  "scripts": {
    "install:all": "npm install && npm install --prefix frontend && npm install --prefix backend",
    "build:all": "npm run build:backend && npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run vercel-build",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\""
  }
}
```

## 🌐 路由规则说明

**API路由**: `/api/*` → 后端NestJS服务
```
https://your-app.vercel.app/api/auth/login
https://your-app.vercel.app/api/market/orders
```

**前端路由**: `/*` → Vue3静态资源
```
https://your-app.vercel.app/          # 首页
https://your-app.vercel.app/login     # 登录页
https://your-app.vercel.app/market    # 市场页
```

## ✅ 验证部署

### 验证后端API
```bash
curl https://your-app.vercel.app/api/health
```

### 验证前端
直接访问：`https://your-app.vercel.app`

## 🎁 Monorepo优势

1. **一次部署**: 前后端同时部署到一个域名
2. **无需CORS**: 同域名下无跨域问题
3. **统一管理**: 版本控制和依赖管理更简单
4. **成本更低**: 只需要一个Vercel项目

## 🔍 故障排除

### 构建失败
- 检查 `npm run build:all` 是否在本地正常执行
- 查看Vercel构建日志定位具体错误

### API调用失败
- 确认路由配置正确
- 检查后端环境变量设置

### 前端页面无法加载
- 检查前端构建输出目录
- 确认static-build配置正确

## 🚀 本地开发

```bash
# 安装所有依赖
npm run install:all

# 同时启动前后端开发服务器
npm run dev

# 分别启动
npm run dev:frontend  # 前端: http://localhost:3001
npm run dev:backend   # 后端: http://localhost:3000
```

## 📝 注意事项

1. **环境变量**: 前端变量必须以 `VITE_` 开头
2. **API地址**: Monorepo模式下使用相对路径 `/api`
3. **构建顺序**: 先构建后端，再构建前端
4. **数据库**: 确保在部署前已初始化数据库

---

**推荐使用Monorepo统一部署方式，更简单高效！** 🎉
# Vercel部署指南

## 项目概述
这是一个前后端分离的项目：
- **前端**: Vue3 + Vite + Vant UI
- **后端**: NestJS + TypeORM + PostgreSQL
- **数据库**: Neon Serverless Postgres

## 📁 项目结构
```
zhzb/
├── frontend/           # Vue3 前端项目
│   ├── src/
│   ├── package.json
│   └── vercel.json     # 前端Vercel配置
├── backend/            # NestJS 后端项目
│   ├── src/
│   ├── package.json
│   └── vercel.json     # 后端Vercel配置
├── database-init-postgres.sql  # PostgreSQL数据库初始化脚本
└── vercel.json         # 根目录说明文件(不用于部署)
```

## 🚀 部署步骤

### 步骤1: 数据库初始化
在Neon控制台中执行 `database-init-postgres.sql` 脚本来创建所有必要的表。

### 步骤2: 后端部署（先部署）

**2.1 在Vercel创建后端项目：**
1. 登录Vercel Dashboard
2. 点击 "New Project"
3. 选择你的GitHub仓库
4. **重要**: 在Root Directory中选择 `backend` 文件夹
5. Framework Preset 选择 "Other"

**2.2 配置构建设置：**
- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- Install Command: `npm install`

**2.3 配置环境变量：**
```
NODE_ENV=production
DATABASE_URL=your_neon_database_url_here
JWT_SECRET=zhzb_jwt_secret_key_2024_nestjs
JWT_EXPIRE_TIME=7d
CORS_ORIGIN=*
VERCEL=1
```

**2.4 部署并获取API域名**
部署成功后，记录API域名，格式类似：`https://your-backend-xxx.vercel.app`

### 步骤3: 前端部署（后部署）

**3.1 在Vercel创建前端项目：**
1. 再次点击 "New Project"
2. 选择同一个GitHub仓库
3. **重要**: 在Root Directory中选择 `frontend` 文件夹
4. Framework Preset 选择 "Vite"

**3.2 配置构建设置：**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**3.3 配置环境变量：**
```
VITE_API_BASE_URL=https://your-backend-xxx.vercel.app/api
```
（使用步骤2.4中获取的后端域名）

**3.4 部署前端**

## 🔧 重要配置说明

### 前端Vercel配置 (`frontend/vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 后端Vercel配置 (`backend/vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "dist/main.js"
    },
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "dist/main.js": {
      "maxDuration": 30
    }
  }
}
```

## 📋 环境变量完整列表

### 后端环境变量
| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | production |
| DATABASE_URL | Neon数据库连接串 | postgresql://... |
| JWT_SECRET | JWT密钥 | zhzb_jwt_secret_key_2024_nestjs |
| JWT_EXPIRE_TIME | JWT过期时间 | 7d |
| CORS_ORIGIN | CORS允许源 | * |
| VERCEL | Vercel标识 | 1 |

### 前端环境变量
| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| VITE_API_BASE_URL | 后端API地址 | https://your-backend.vercel.app/api |

## ✅ 验证部署

### 验证后端
访问：`https://your-backend-xxx.vercel.app/api/health`
应该返回健康检查信息

### 验证前端
1. 访问前端域名确认页面加载
2. 测试用户注册和登录功能
3. 检查API调用是否正常
4. 验证数据库连接和操作

## 🔍 故障排除

### 常见问题
1. **后端函数超时**: 检查数据库连接和查询性能
2. **CORS错误**: 确认CORS_ORIGIN环境变量设置
3. **API调用失败**: 检查前端VITE_API_BASE_URL是否正确
4. **数据库连接失败**: 验证DATABASE_URL格式和权限

### 调试方法
- 查看Vercel函数日志
- 确认环境变量配置正确
- 验证数据库连接字符串
- 检查网络请求响应

## 📝 注意事项

1. **部署顺序**: 必须先部署后端，获得API域名后再部署前端
2. **环境变量**: 前端环境变量必须以`VITE_`开头
3. **路径配置**: 确保选择正确的根目录（frontend或backend）
4. **数据库**: 确保在部署前已执行数据库初始化脚本
5. **CORS**: 生产环境建议设置具体的前端域名而不是`*`

## 🎯 部署后优化

1. 设置自定义域名
2. 配置CDN缓存策略
3. 监控性能和错误日志
4. 设置告警通知


# GitHub 登录配置指南

## 1. Supabase 配置

### 1.1 创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 在项目设置中获取以下信息：
   - Project URL
   - Anon Key
   - Service Role Key

### 1.2 配置 GitHub OAuth
1. 在 Supabase 项目控制台中，进入 Authentication > Providers
2. 启用 GitHub 提供商
3. 配置 GitHub OAuth App：
   - 在 GitHub 设置中创建新的 OAuth App
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
   - 将 Client ID 和 Client Secret 填入 Supabase

## 2. 环境变量配置

### 2.1 后端环境变量
在 `backend/.env` 文件中添加：
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 2.2 前端环境变量
在 `frontend/.env` 文件中添加：
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 3. 数据库迁移

运行以下 SQL 脚本来更新数据库结构：
```sql
-- 执行 database-migration-github.sql 中的内容
```

## 4. 功能说明

### 4.1 登录流程
1. 用户点击 "使用 GitHub 登录" 按钮
2. 重定向到 GitHub OAuth 授权页面
3. 用户授权后，GitHub 重定向到 Supabase
4. Supabase 处理 OAuth 回调并返回 access token
5. 前端将 access token 发送到后端 `/auth/github-login` 端点
6. 后端验证 token 并创建/更新用户信息
7. 返回 JWT token 给前端

### 4.2 用户信息同步
- 首次登录：创建新用户，使用 GitHub 用户名和邮箱
- 再次登录：更新现有用户信息（如头像）
- 支持 GitHub 用户和传统用户共存

### 4.3 安全特性
- 使用 Supabase 服务端验证 GitHub access token
- 支持 JWT token 认证
- 密码字段对 GitHub 用户可选

## 5. 测试

1. 启动后端服务：`npm run dev:backend`
2. 启动前端服务：`npm run dev:frontend`
3. 访问登录页面，点击 "使用 GitHub 登录"
4. 完成 GitHub 授权流程
5. 验证用户信息是否正确保存

## 6. 故障排除

### 常见问题
1. **OAuth 回调失败**：检查 GitHub OAuth App 的 callback URL 配置
2. **环境变量未生效**：确保重启开发服务器
3. **数据库字段错误**：运行数据库迁移脚本
4. **Supabase 配置错误**：检查项目 URL 和密钥是否正确

### 调试技巧
- 查看浏览器控制台和网络请求
- 检查后端日志输出
- 验证 Supabase 项目配置

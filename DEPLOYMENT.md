# Vercel部署指南

## 项目概述
- **前端**: Vue3 + Vite + Vant UI
- **后端**: NestJS + TypeORM + PostgreSQL
- **数据库**: Neon Serverless Postgres

## 部署前准备

### 1. 数据库初始化
在Neon数据库中执行 `database-init-postgres.sql` 脚本来创建所有必要的表。

### 2. 环境变量设置
在Vercel项目设置中配置以下环境变量：

**后端项目环境变量：**
```
NODE_ENV=production
DATABASE_URL=your_neon_database_url
JWT_SECRET=zhzb_jwt_secret_key_2024_nestjs
JWT_EXPIRE_TIME=7d
CORS_ORIGIN=https://your-frontend-domain.vercel.app
VERCEL=1
```

## 部署步骤

### 1. 后端部署
1. 在Vercel创建新项目，选择 `backend` 目录
2. 构建命令：`npm run vercel-build`
3. 输出目录：`dist`
4. 配置上述环境变量
5. 部署后获取API域名

### 2. 前端部署
1. 在Vercel创建新项目，选择 `frontend` 目录
2. 构建命令：`npm run build`
3. 输出目录：`dist`
4. 配置环境变量：
   ```
   VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
   ```

## 主要修改说明

### 后端修改
1. **数据库配置**: 从MySQL切换到PostgreSQL
2. **Serverless适配**: main.ts支持Vercel Functions
3. **依赖更新**: 添加pg驱动，移除mysql2
4. **CORS配置**: 支持跨域访问

### 前端修改
1. **API配置**: 支持环境变量动态配置API地址
2. **环境文件**: 分离开发和生产环境配置

### 数据库修改
1. **PostgreSQL兼容**: 转换MySQL语法到PostgreSQL
2. **触发器**: 自动更新时间戳
3. **约束**: 使用CHECK约束替代ENUM

## 验证部署
1. 访问前端域名确认页面加载
2. 测试用户注册和登录功能
3. 检查API调用是否正常
4. 验证数据库连接和操作

## 故障排除
- 检查Vercel函数日志
- 确认环境变量配置正确
- 验证数据库连接字符串
- 检查CORS设置
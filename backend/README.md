<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## TODO（进度）

- [x] 安装/确认 MySQL 容器运行，验证 root/Tjfae@123（容器 mysql572 已运行）
- [x] 执行 database-init.sql 初始化 zhzb 数据库（已初始化并验证）
- [x] 后端集成 TypeORM+ConfigModule+实体与全局校验
- [x] 实现认证模块：注册/登录/JWT 守卫
- [x] 实现公告模块：列表/详情/阅读量统计
- [x] 实现钱包模块：余额/充值/银行卡/交易记录
- [x] 实现市场模块：发布卖单/买入/我的订单/取消
- [x] 实现积分模块：余额查询/管理员加积分
- [x] 实现管理员统计：手续费/订单/用户/公告统计
- [x] 前端新增登录/注册与路由守卫
- [x] 前端切换为真实 API，对接所有页面与状态
- [x] 统一端口与代理；修正 baseURL 为后端端口
- [x] 完善交互细节：骨架屏/加载态/失败重试
- [x] 安全与风控：限流、阈值校验、审计日志
- [x] 补充运行与接口说明、调试指南

## Project setup

```bash
$ npm install
```

## Run (Backend)

```bash
# 开发模式
npm run start:dev

# 生产构建
npm run build && npm run start:prod
```

## Environment (.env 示例)

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

## API Quick Reference

- 认证
  - POST `/api/auth/register`
  - POST `/api/auth/login`
  - GET  `/api/auth/profile` (Bearer Token)
- 公告
  - GET  `/api/announcements`
  - GET  `/api/announcements/:id` (自动+1 阅读量)
- 市场
  - GET  `/api/market/orders`
  - POST `/api/market/sell` (auth)
  - POST `/api/market/buy/:id` (auth)
  - GET  `/api/market/my-orders` (auth)
  - DELETE `/api/market/orders/:id` (auth)
- 钱包
  - GET  `/api/wallet/info` (auth)
  - POST `/api/wallet/recharge` (auth)
  - GET  `/api/wallet/transactions` (auth)
  - GET  `/api/wallet/bank-cards` (auth)
  - POST `/api/wallet/bank-card` (auth)
  - DELETE `/api/wallet/bank-cards/:id` (auth)
- 积分
  - GET  `/api/points/balance` (auth)
  - POST `/api/points/add/:userId` (auth, 管理员入口预留)
- 管理员
  - GET  `/api/admin/statistics` (auth)

## Debug Tips

- Docker MySQL 验证
  ```bash
  docker exec -it mysql572 mysql -h127.0.0.1 -uroot -p'Tjfae@123' -e "SHOW DATABASES;"
  ```
- 初始化数据库（已做）
  ```bash
  docker exec -i mysql572 mysql -h127.0.0.1 -uroot -p'Tjfae@123' < ../database-init.sql
  ```
- 常见问题
  - 401：检查前端 localStorage token 是否存在/过期
  - 连接拒绝：确认后端 3000 端口、Vite 代理、Docker 映射
  - SQL 报错：核对 `.env` 数据库连接与 `database-init.sql` 是否执行
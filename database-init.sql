-- 智慧账簿数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS zhzb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE zhzb;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  password VARCHAR(255) NOT NULL COMMENT '密码hash',
  role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色',
  aic_points DECIMAL(10, 4) DEFAULT 1000.0000 COMMENT 'AIC积分',
  hh_points DECIMAL(10, 4) DEFAULT 1000.0000 COMMENT 'HH积分',
  frozen_aic_points DECIMAL(10, 4) DEFAULT 0.0000 COMMENT '冻结AIC积分',
  frozen_hh_points DECIMAL(10, 4) DEFAULT 0.0000 COMMENT '冻结HH积分',
  balance DECIMAL(10, 2) DEFAULT 10000.00 COMMENT '余额',
  frozen_balance DECIMAL(10, 2) DEFAULT 0.00 COMMENT '冻结余额',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '买方用户ID',
  seller_id INT NULL COMMENT '卖方用户ID',
  type ENUM('buy', 'sell') NOT NULL COMMENT '订单类型',
  status ENUM('pending', 'paid', 'completed', 'cancelled', 'active') DEFAULT 'pending' COMMENT '订单状态',
  point_type ENUM('AIC', 'HH') NOT NULL COMMENT '积分类型',
  amount DECIMAL(10, 4) NOT NULL COMMENT '数量',
  remaining_amount DECIMAL(10, 4) NULL COMMENT '剩余数量',
  unit_price DECIMAL(8, 2) NOT NULL COMMENT '单价',
  total_price DECIMAL(10, 2) NOT NULL COMMENT '总价',
  fee DECIMAL(8, 2) DEFAULT 0.00 COMMENT '手续费',
  seller_name VARCHAR(50) NULL COMMENT '卖方用户名',
  buyer_name VARCHAR(50) NULL COMMENT '买方用户名',
  comment TEXT NULL COMMENT '评价内容',
  rating INT DEFAULT 5 COMMENT '评分(1-5)',
  paid_at TIMESTAMP NULL COMMENT '付款时间',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_seller_id (seller_id),
  INDEX idx_status (status),
  INDEX idx_point_type (point_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  type ENUM('recharge', 'withdraw', 'buy', 'sell', 'fee') NOT NULL COMMENT '交易类型',
  status ENUM('pending', 'completed', 'failed') DEFAULT 'completed' COMMENT '交易状态',
  title VARCHAR(100) NOT NULL COMMENT '交易标题',
  amount DECIMAL(10, 2) NOT NULL COMMENT '交易金额',
  balance_after DECIMAL(10, 2) NOT NULL COMMENT '交易后余额',
  description TEXT NULL COMMENT '交易描述',
  related_order_id INT NULL COMMENT '关联订单ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

-- 银行卡表
CREATE TABLE IF NOT EXISTS bank_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  card_number VARCHAR(50) NOT NULL COMMENT '银行卡号',
  holder_name VARCHAR(50) NOT NULL COMMENT '持卡人姓名',
  bank_name VARCHAR(50) NOT NULL COMMENT '银行名称',
  phone VARCHAR(20) NOT NULL COMMENT '预留手机号',
  is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认银行卡',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='银行卡表';

-- 公告表
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '公告标题',
  content TEXT NOT NULL COMMENT '公告内容',
  type ENUM('system', 'notice', 'warning', 'activity', 'service') DEFAULT 'notice' COMMENT '公告类型',
  status ENUM('draft', 'published', 'archived') DEFAULT 'published' COMMENT '公告状态',
  is_important BOOLEAN DEFAULT FALSE COMMENT '是否重要公告',
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_is_important (is_important),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- 管理员日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL COMMENT '管理员用户ID',
  action VARCHAR(100) NOT NULL COMMENT '操作动作',
  target_user_id INT NULL COMMENT '目标用户ID',
  details JSON NULL COMMENT '操作详情',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_admin_id (admin_id),
  INDEX idx_target_user_id (target_user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员日志表';

-- 插入默认用户数据
INSERT INTO users (username, email, password, role, aic_points, hh_points, balance) VALUES
('demo_user', 'demo@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye', 'user', 1000.0000, 1000.0000, 10000.00),
('积分大户01', 'trader1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye', 'user', 2000.0000, 1500.0000, 15000.00),
('积分商家02', 'trader2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye', 'user', 1800.0000, 2200.0000, 18000.00),
('积分投资者03', 'investor@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye', 'user', 3000.0000, 1000.0000, 25000.00),
('admin', 'admin@zhzb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye', 'admin', 5000.0000, 5000.0000, 50000.00);

-- 插入默认市场订单
INSERT INTO orders (user_id, seller_id, type, status, point_type, amount, remaining_amount, unit_price, total_price, seller_name) VALUES
(2, 2, 'sell', 'active', 'AIC', 500.0000, 500.0000, 0.85, 425.00, '积分大户01'),
(3, 3, 'sell', 'active', 'HH', 1000.0000, 800.0000, 1.20, 1200.00, '积分商家02'),
(4, 4, 'sell', 'active', 'AIC', 2000.0000, 1500.0000, 0.90, 1800.00, '积分投资者03');

-- 插入默认公告数据
INSERT INTO announcements (title, content, type, is_important, view_count) VALUES
('系统升级维护通知', '为了给用户提供更好的服务体验，系统将于本周六凌晨2:00-6:00进行升级维护，期间系统将暂停服务。请各位用户合理安排时间，避免在维护期间进行交易操作。升级完成后，系统将新增多项功能优化，敬请期待！', 'system', TRUE, 1250),
('积分交易新规则发布', '为规范积分交易市场秩序，保护用户合法权益，现发布新的交易规则：\n\n1. 单笔交易最低金额调整为100元\n2. 交易手续费率调整为千分之三\n3. 新增交易冷却期机制\n4. 优化订单匹配算法\n\n详细规则请查看用户协议，如有疑问请联系客服。新规则将于下周一正式生效。', 'notice', TRUE, 2340),
('AIC积分价格波动提醒', '近期AIC积分价格出现较大波动，提醒广大用户理性交易，注意风险控制。建议：\n\n• 关注市场动态，合理判断买卖时机\n• 不要投入超出承受能力的资金\n• 分散投资，降低风险\n• 如有异常情况及时联系客服\n\n投资有风险，入市需谨慎！', 'warning', FALSE, 890),
('新用户福利活动开启', '欢迎新用户加入智慧账簿！为回馈新用户支持，现推出限时福利活动：\n\n🎉 新用户注册即送1000积分\n🎉 首次充值享受5%奖励\n🎉 邀请好友双方各得500积分\n🎉 完成实名认证额外获得200积分\n\n活动时间：即日起至月底\n详情咨询客服微信：zhzb2024', 'activity', FALSE, 1560),
('客服服务时间调整通知', '为了更好地为用户提供服务，客服服务时间做如下调整：\n\n工作日：9:00 - 22:00\n周末及节假日：10:00 - 20:00\n\n紧急情况请通过以下方式联系：\n• 客服QQ：12345678\n• 客服微信：zhzb_service\n• 客服电话：400-123-4567\n\n感谢您的理解与支持！', 'service', FALSE, 670);

-- 显示表创建完成信息
SELECT 'Database zhzb initialized successfully!' as status;
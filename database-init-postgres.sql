-- 智慧账簿PostgreSQL数据库初始化脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  aic_points DECIMAL(10, 4) DEFAULT 1000.0000,
  hh_points DECIMAL(10, 4) DEFAULT 1000.0000,
  frozen_aic_points DECIMAL(10, 4) DEFAULT 0.0000,
  frozen_hh_points DECIMAL(10, 4) DEFAULT 0.0000,
  balance DECIMAL(10, 2) DEFAULT 10000.00,
  frozen_balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为用户表创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  seller_id INTEGER,
  type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled', 'active')),
  point_type VARCHAR(10) NOT NULL CHECK (point_type IN ('AIC', 'HH')),
  amount DECIMAL(10, 4) NOT NULL,
  remaining_amount DECIMAL(10, 4),
  unit_price DECIMAL(8, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(8, 2) DEFAULT 0.00,
  seller_name VARCHAR(50),
  buyer_name VARCHAR(50),
  comment TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  paid_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 为订单表创建索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_point_type ON orders(point_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('recharge', 'withdraw', 'buy', 'sell', 'fee')),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  related_order_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 为交易记录表创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- 银行卡表
CREATE TABLE IF NOT EXISTS bank_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  card_number VARCHAR(50) NOT NULL,
  holder_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 为银行卡表创建索引
CREATE INDEX IF NOT EXISTS idx_bank_cards_user_id ON bank_cards(user_id);

-- 公告表
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'notice' CHECK (type IN ('system', 'notice', 'warning', 'activity', 'service')),
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_important BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为公告表创建索引
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- 管理员日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_user_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 为管理员日志表创建索引
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- 创建触发器函数以自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认管理员用户（密码需要加密后插入）
INSERT INTO users (username, email, password, role)
VALUES ('admin', 'admin@zhzb.com', '$2b$10$example_hashed_password', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 插入默认公告
INSERT INTO announcements (title, content, type, status)
VALUES
('欢迎使用智慧账簿', '欢迎使用智慧账簿系统，开始您的积分交易之旅！', 'notice', 'published'),
('系统维护通知', '系统将于每周日凌晨2-4点进行维护，请合理安排交易时间。', 'system', 'published'),
('系统升级维护通知', '为了给用户提供更好的服务体验，系统将于本周六凌晨2:00-6:00进行升级维护，期间系统将暂停服务。请各位用户合理安排时间，避免在维护期间进行交易操作。升级完成后，系统将新增多项功能优化，敬请期待！', 'system', TRUE, 1250),
('积分交易新规则发布', '为规范积分交易市场秩序，保护用户合法权益，现发布新的交易规则：\n\n1. 单笔交易最低金额调整为100元\n2. 交易手续费率调整为千分之三\n3. 新增交易冷却期机制\n4. 优化订单匹配算法\n\n详细规则请查看用户协议，如有疑问请联系客服。新规则将于下周一正式生效。', 'notice', TRUE, 2340),
('AIC积分价格波动提醒', '近期AIC积分价格出现较大波动，提醒广大用户理性交易，注意风险控制。建议：\n\n• 关注市场动态，合理判断买卖时机\n• 不要投入超出承受能力的资金\n• 分散投资，降低风险\n• 如有异常情况及时联系客服\n\n投资有风险，入市需谨慎！', 'warning', FALSE, 890),
('新用户福利活动开启', '欢迎新用户加入智慧账簿！为回馈新用户支持，现推出限时福利活动：\n\n🎉 新用户注册即送1000积分\n🎉 首次充值享受5%奖励\n🎉 邀请好友双方各得500积分\n🎉 完成实名认证额外获得200积分\n\n活动时间：即日起至月底\n详情咨询客服微信：zhzb2024', 'activity', FALSE, 1560),
('客服服务时间调整通知', '为了更好地为用户提供服务，客服服务时间做如下调整：\n\n工作日：9:00 - 22:00\n周末及节假日：10:00 - 20:00\n\n紧急情况请通过以下方式联系：\n• 客服QQ：12345678\n• 客服微信：zhzb_service\n• 客服电话：400-123-4567\n\n感谢您的理解与支持！', 'service', FALSE, 670)
ON CONFLICT DO NOTHING;

-- =============================================
-- 兼容旧版本数据库的修复（可重复执行，安全）
-- 若数据库是由早期脚本创建，可能缺失以下列或约束。
-- 该部分语句用于在已有库上补齐结构；全新初始化可忽略。
-- =============================================

-- 补齐 bank_cards 缺失列
ALTER TABLE IF EXISTS bank_cards
  ADD COLUMN IF NOT EXISTS holder_name VARCHAR(100);

ALTER TABLE IF EXISTS bank_cards
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 补齐 announcements 缺失列
ALTER TABLE IF EXISTS announcements
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft','published','archived'));

ALTER TABLE IF EXISTS announcements
  ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false;

-- 补齐 transactions 缺失列
ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT '';

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS balance_after DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS related_order_id INTEGER;


  ALTER TABLE users 
ADD COLUMN github_id VARCHAR(255) UNIQUE,
ADD COLUMN avatar VARCHAR(500);

-- 修改 password 字段为可空（因为 GitHub 用户可能没有密码）
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- 创建索引以提高查询性能
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_email ON users(email);

-- 添加 Google 相关字段
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 相关索引（若未创建）
CREATE INDEX IF NOT EXISTS idx_transactions_related_order_id ON transactions(related_order_id);

-- 修复/重建 transactions.type 与 transactions.status 的 CHECK 约束
DO $$
BEGIN
  -- 移除旧的类型约束（名称可能不同，这里尝试常见命名与系统生成的命名）
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'transactions' AND c.conname = 'transactions_type_check'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
  END IF;
  -- 一些自动命名的检查约束可能叫 transactions_type_check1/2，尝试删除
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'transactions' AND c.conname = 'transactions_type_check1'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT transactions_type_check1;
  END IF;

  -- 重新创建正确的类型检查约束
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_type_check CHECK (type IN ('recharge','withdraw','buy','sell','fee'));

  -- 移除旧的状态约束
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'transactions' AND c.conname = 'transactions_status_check'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT transactions_status_check;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'transactions' AND c.conname = 'transactions_status_check1'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT transactions_status_check1;
  END IF;

  -- 重新创建正确的状态检查约束
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_status_check CHECK (status IN ('pending','completed','failed'));
END $$;

import { createClient } from '@supabase/supabase-js';
import path from 'path';

// 在本地开发环境下，确保在最早阶段加载 backend/.env
// 生产环境（如 Vercel）保持现有方式，不主动从文件加载
if (process.env.NODE_ENV !== 'production') {
  try {
    // __dirname 位于 src/config，编译后为 dist/config
    // 回退两级到 backend 根目录，定位到 backend/.env
    const envPath = path.resolve(__dirname, '../../.env');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config({ path: envPath });
    // 可选调试：仅在本地输出一次
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[Supabase] 本地加载 .env 后变量仍不完整，请检查 backend/.env');
    }
  } catch (e) {
    console.warn('[Supabase] 本地加载 .env 失败:', (e as Error).message);
  }
}

export const supabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

// 检查是否配置了 Supabase
const isSupabaseConfigured = () => {
  const configured = process.env.SUPABASE_URL && 
         process.env.SUPABASE_ANON_KEY && 
         process.env.SUPABASE_SERVICE_ROLE_KEY &&
         process.env.SUPABASE_URL !== '' &&
         process.env.SUPABASE_ANON_KEY !== '' &&
         process.env.SUPABASE_SERVICE_ROLE_KEY !== '' &&
         !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('PLACEHOLDER');
  if (configured) {
    console.log('[Supabase] 配置检测: 已配置');
  } else {
    console.warn('[Supabase] 配置检测: 未正确配置，Supabase 功能不可用');
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === '') {
      console.warn('SUPABASE_URL 未设置');
    }
    if (!process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY === '') {
      console.warn('SUPABASE_ANON_KEY 未设置');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === '') {
      console.warn('SUPABASE_SERVICE_ROLE_KEY 未设置');
    } else if (process.env.SUPABASE_SERVICE_ROLE_KEY.includes('PLACEHOLDER')) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY 仍为 PLACEHOLDER');
    }
  }
  return configured;
};

// 创建服务端客户端（使用 service role key）
export const supabaseAdmin = isSupabaseConfigured() 
  ? (() => {
      console.log('[Supabase] 创建 service role 客户端 (supabaseAdmin)');
      return createClient(
        supabaseConfig.url,
        supabaseConfig.serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    })()
  : null;

// 创建客户端（使用 anon key）
export const supabase = isSupabaseConfigured()
  ? (() => {
      console.log('[Supabase] 创建 anon 客户端 (supabase)');
      return createClient(
        supabaseConfig.url,
        supabaseConfig.anonKey
      );
    })()
  : null;

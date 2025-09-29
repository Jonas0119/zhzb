import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';

interface Counter {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Counter>();
const WINDOW_MS = 60 * 1000; // 1分钟
const LIMIT = parseInt(process.env.RATE_LIMIT_PER_MIN || '60', 10);

@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = `${req.user?.userId || req.ip}`;
    const now = Date.now();
    let counter = buckets.get(key);
    if (!counter || counter.resetAt < now) {
      counter = { count: 0, resetAt: now + WINDOW_MS };
      buckets.set(key, counter);
    }
    counter.count++;
    if (counter.count > LIMIT) {
      throw new BadRequestException('请求过于频繁，请稍后再试');
    }
    return true;
  }
}



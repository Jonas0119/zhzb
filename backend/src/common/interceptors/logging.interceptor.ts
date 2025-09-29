import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;
    const userId = req.user?.userId ?? '-';
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        // eslint-disable-next-line no-console
        console.log(`[AUDIT] ${method} ${originalUrl} uid=${userId} ip=${ip} ${ms}ms`);
      })
    );
  }
}



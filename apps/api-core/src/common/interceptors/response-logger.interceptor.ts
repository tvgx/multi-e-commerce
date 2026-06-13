import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ResponseLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API-Response');

  // Serializing response bodies doubles the JSON.stringify cost of every
  // request and leaks PII into logs — only enable it explicitly in dev.
  private readonly logBodies = process.env.LOG_RESPONSE_BODIES === 'true';

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const { method, url } = req;
    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Bỏ qua các endpoint không quan trọng (ví dụ: health check) nếu cần
        if (url.includes('/health')) return;

        this.logger.log(
          `[${method}] ${url} - Status: ${statusCode} - Time: ${responseTime}ms` +
          (this.logBodies ? ` - Body: ${JSON.stringify(data)}` : '')
        );
      }),
    );
  }
}

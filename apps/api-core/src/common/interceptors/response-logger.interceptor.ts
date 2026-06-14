import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

const SENSITIVE_KEYS = [
  'password',
  'newpassword',
  'currentpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authorization',
];

/** Recursively replace sensitive field values with *** so we never log PII/secrets. */
function maskSensitive(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(maskSensitive);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEYS.includes(k.toLowerCase()) ? '***' : maskSensitive(v);
  }
  return out;
}

/** Stringify + truncate so a huge payload doesn't flood the terminal. */
function preview(data: unknown, max = 500): string {
  let str: string;
  try {
    str = typeof data === 'string' ? data : JSON.stringify(data);
  } catch {
    str = String(data);
  }
  if (str == null) return 'null';
  return str.length > max ? `${str.slice(0, max)}… (+${str.length - max} chars)` : str;
}

@Injectable()
export class ResponseLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API-Response');

  // Serializing request/response bodies costs CPU and can leak PII — only in dev
  // (or when explicitly enabled). The box header/status always logs.
  private readonly logBodies =
    process.env.LOG_RESPONSE_BODIES === 'true' ||
    process.env.NODE_ENV !== 'production';

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const method: string = req.method;
    const path: string = req.originalUrl || req.url;
    const shopId = req.headers?.['x-shop-id'];
    const authType = req.headers?.['x-auth-type'];
    const startTime = Date.now();

    // Skip noisy health checks.
    if (path.includes('/health')) return next.handle();

    return next.handle().pipe(
      tap((data) => {
        this.printBlock(method, path, res.statusCode, Date.now() - startTime, req.body, data, shopId, authType, false);
      }),
      catchError((err) => {
        const status = err?.status ?? err?.statusCode ?? 500;
        const body = err?.response ?? { message: err?.message };
        this.printBlock(method, path, status, Date.now() - startTime, req.body, body, shopId, authType, true);
        return throwError(() => err);
      }),
    );
  }

  private printBlock(
    method: string,
    path: string,
    status: number,
    ms: number,
    reqBody: unknown,
    data: unknown,
    shopId?: string,
    authType?: string,
    isError = false,
  ) {
    const lines: string[] = [];
    lines.push(`┌─ [${method}] ${path}`);

    const meta: string[] = [];
    if (shopId) meta.push(`shop=${shopId}`);
    if (authType) meta.push(`auth=${authType}`);
    if (meta.length) lines.push(`│ ${meta.join('   ')}`);

    if (this.logBodies && reqBody && typeof reqBody === 'object' && Object.keys(reqBody as object).length) {
      lines.push(`│ req  : ${preview(maskSensitive(reqBody))}`);
    }

    lines.push(`│ res  : ${status} · ${ms}ms`);

    if (this.logBodies) {
      lines.push(`│ data : ${preview(maskSensitive(data))}`);
    }

    lines.push(`└${'─'.repeat(46)}`);

    const msg = lines.join('\n');
    // Color by level: <400 green (log), 4xx yellow (warn), 5xx/error red (error).
    if (status >= 500 || isError) this.logger.error(msg);
    else if (status >= 400) this.logger.warn(msg);
    else this.logger.log(msg);
  }
}

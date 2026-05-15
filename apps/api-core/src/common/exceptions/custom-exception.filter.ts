import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomException } from './custom.exception';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CustomExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let code = '9999';
    let message = 'Exception error.';
    const data = null;

    if (exception instanceof CustomException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.customMessage || exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      // Map common NestJS errors if needed
      if (status === 400) code = '1004'; // Parameter value is invalid
      if (status === 401) code = '9998'; // Token is invalid / Unauthorized
      if (status === 403) code = '1009'; // Not access
      if (status === 404) code = '1005'; // Unknown (Not found)
    }

    // Keep response format stable while surfacing root cause in server logs.
    const isNoise =
      status === 404 &&
      (req.url.includes('.well-known') || req.url.includes('favicon.ico'));

    if (status >= 500) {
      this.logger.error(
        `Unhandled exception: ${message}`,
        exception?.stack || String(exception),
      );
    } else if (!isNoise) {
      this.logger.warn(
        `Http Exception (${status}): ${message} - ${req.method} ${req.url}`,
      );
    }

    response.status(status).json({
      code,
      message,
      data,
    });
  }
}

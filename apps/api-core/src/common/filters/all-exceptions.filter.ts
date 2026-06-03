import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors = null;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        message = (response as any).message || message;
        errors = (response as any).errors || null;
      }
    } else {
      // Prisma or Mongoose exception handling could be added here
      console.error('Unhandled Exception:', exception);
    }

    const responseBody = {
      statusCode: httpStatus,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      // Include shopId for tracing if available from request context/headers
      shopId: request.headers['x-shop-id'] || request.headers['x-tenant-id'] || null,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}

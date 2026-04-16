import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomException } from './custom.exception';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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

    response.status(status).json({
      code,
      message,
      data,
    });
  }
}

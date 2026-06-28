import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { CustomException } from './custom.exception';
import { ResponseCodes } from '../constants/response-codes.constant';

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
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Map các lỗi DB phổ biến sang HTTP/code có nghĩa thay vì 500 "Exception error.".
      switch (exception.code) {
        case 'P2002': {
          // Unique constraint violation → 409 Conflict
          status = 409;
          code = ResponseCodes.PARAM_VALUE_INVALID;
          const target = (exception.meta?.target as string[] | string) ?? '';
          const fields = Array.isArray(target) ? target.join(', ') : target;
          message = fields
            ? `Giá trị đã tồn tại: ${fields}`
            : 'Dữ liệu đã tồn tại (vi phạm ràng buộc duy nhất).';
          break;
        }
        case 'P2025': {
          // Record not found (update/delete trên bản ghi không tồn tại) → 404
          status = 404;
          code = ResponseCodes.UNKNOWN_ERROR;
          message =
            (exception.meta?.cause as string) || 'Không tìm thấy bản ghi.';
          break;
        }
        case 'P2003': {
          // Foreign key constraint violation → 400
          status = 400;
          code = ResponseCodes.PARAM_VALUE_INVALID;
          message = 'Tham chiếu không hợp lệ (vi phạm khóa ngoại).';
          break;
        }
        default: {
          status = 400;
          code = ResponseCodes.PARAM_VALUE_INVALID;
          message = `Lỗi cơ sở dữ liệu (${exception.code}).`;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      // Sai kiểu/thiếu trường khi gọi Prisma → 400 thay vì 500
      status = 400;
      code = ResponseCodes.PARAM_TYPE_INVALID;
      message = 'Dữ liệu gửi lên không hợp lệ.';
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
      this.logger.error(
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

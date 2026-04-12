import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ResponseCode,
  ResponseCodes,
} from '../constants/response-codes.constant';

export class CustomException extends HttpException {
  constructor(
    public readonly code: ResponseCode,
    public readonly customMessage?: string,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST, // Mặc định map HTTP về 400
  ) {
    // Determine default message based on the code if not provided
    super(customMessage || 'Exception error.', httpStatus);
  }
}

export class BaseResponseDto<T> {
  code: string;
  message: string;
  data?: T;

  constructor(code: string, message: string, data?: T) {
    this.code = code;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }

  static success<T>(data?: T): BaseResponseDto<T> {
    return new BaseResponseDto('1000', 'OK', data);
  }

  // Helper method for error responses with custom codes
  static error(code: string, message: string): BaseResponseDto<null> {
    return new BaseResponseDto(code, message);
  }
}

export const ResponseCodes = {
  // Thành công
  SUCCESS: '1000',

  // Lỗi Database & System
  DB_CONNECTION_ERROR: '1001',
  EXCEPTION_ERROR: '9999',
  UNKNOWN_ERROR: '1005',

  // Lỗi Param cơ bản
  PARAM_NOT_ENOUGH: '1002',
  PARAM_TYPE_INVALID: '1003',
  PARAM_VALUE_INVALID: '1004',

  // Lỗi Authentication & User
  TOKEN_INVALID: '9998',
  USER_NOT_VALIDATED: '9995',
  USER_EXISTED: '9996',
  CODE_VERIFY_INCORRECT: '9993', // Thường dùng cho sai Pass hoặc OTP
  CHANGE_USERNAME_REQUIRES_30_DAYS: '1017',
  CHANGE_USERNAME_SAME_OTHER: '1018',

  // Lỗi Feature: Product & Order
  PRODUCT_NOT_EXISTED: '9992',
  NO_DATA_END_OF_LIST: '9994',
  PRODUCT_SOLD: '1011',
  POLICY_VIOLATION: '1016',
  ADDRESS_NOT_SUPPORT_SHIPPING: '1012',
  PROMO_CODE_EXPIRED: '1014',
  CANT_PROCESS_BANK_CARD: '1015',

  // Lỗi Feature: Shop, Upload, Security
  METHOD_INVALID: '9997',
  NOT_ACCESS: '1009',
  FILE_SIZE_TOO_BIG: '1006',
  UPLOAD_FILE_FAILED: '1007',
  MAXIMUM_IMAGES: '1008',
  ACTION_DONE_PREVIOUSLY: '1010',
  URL_USER_IS_EXIST: '1013',
  SPAM: '9991',
} as const;

export type ResponseCode = typeof ResponseCodes[keyof typeof ResponseCodes];

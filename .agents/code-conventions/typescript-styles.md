# TypeScript

- `strict` mode + `noImplicitAny`. **Cấm `any`** (dùng `unknown` + thu hẹp kiểu nếu cần).
- Ưu tiên `interface` hơn `type` cho object/contract.
- Naming: biến/hàm `camelCase`, class/component/type `PascalCase`, file `kebab-case`.
- `async/await` thay callback; xử lý lỗi tường minh (không nuốt lỗi).
- NestJS: ném exception chuẩn (`BadRequestException`, `InternalServerErrorException`...), không `throw new Error`. Response bọc `BaseResponseDto`.
- Validate dữ liệu I/O bằng Zod (`packages/schema`) / class-validator; nhớ api-core không có global ValidationPipe → validate tay trong service.
- Không hardcode URL/secret — đọc từ env.

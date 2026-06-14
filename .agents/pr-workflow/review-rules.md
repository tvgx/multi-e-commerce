# Review Rules

| Phạm vi thay đổi | Reviewer tối thiểu |
|------------------|:------------------:|
| Code thường (1 app) | 1 |
| Ảnh hưởng prod / nhiều app / public API | 2 |
| Infra / k8s / migration CSDL | 2 (gồm SRE/Tech Lead) |
| Hotfix P1 | fast-track, tag @platform-admin/@sre, SLA 15' |

Reviewer kiểm: đúng yêu cầu, có test, không secret/hardcode, theo [code-conventions](../code-conventions/), response bọc `BaseResponseDto`, không phá multi-tenant. Comment rõ ràng, phân biệt "phải sửa" và "gợi ý". Không tự duyệt PR của chính mình.

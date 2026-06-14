# PR Checklist

Trước khi mở PR:

- [ ] Nhánh tách từ `main`, đặt tên đúng (`feature/`,`fix/`,...).
- [ ] `npm run lint` xanh; `npm run test` xanh; coverage code mới đạt ngưỡng ([code-conventions](../code-conventions/README.md)).
- [ ] Không secret, không file lớn, không `console.log`/debug.
- [ ] Commit đúng `type(scope): subject`.
- [ ] Mô tả PR theo [template.md](template.md); link issue.
- [ ] Cập nhật docs nếu đổi API/schema/CLI (kèm cập nhật [api-doc](../../api-doc/)).
- [ ] Đổi infra → kèm diff + dry-run output.
- [ ] Tag reviewer (≥1; 2 cho thay đổi ảnh hưởng prod).
- [ ] Tự review 1 lượt.

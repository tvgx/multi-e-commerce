import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Điều khoản Dịch vụ — OmniCommerce",
  description:
    "Điều khoản dịch vụ của nền tảng OmniCommerce: quyền và nghĩa vụ khi sử dụng nền tảng.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#030014] text-slate-300 px-6 py-16 font-sans">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Điều khoản Dịch vụ</h1>
        <p className="text-sm text-slate-500 mb-10">Cập nhật lần cuối: 25/06/2026</p>

        <div className="space-y-8 leading-relaxed text-sm md:text-base">
          <section>
            <p>
              Bằng việc tạo tài khoản hoặc sử dụng nền tảng OmniCommerce, bạn đồng ý
              với các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Tài khoản</h2>
            <p>
              Bạn chịu trách nhiệm về tính chính xác của thông tin đăng ký và mọi hoạt
              động diễn ra dưới tài khoản của mình. Hãy bảo mật thông tin đăng nhập và
              thông báo cho chúng tôi nếu phát hiện truy cập trái phép.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              2. Sử dụng dịch vụ
            </h2>
            <p>
              Bạn đồng ý không sử dụng nền tảng cho mục đích bất hợp pháp, không đăng
              tải nội dung vi phạm pháp luật hoặc quyền của bên thứ ba, và không can
              thiệp vào hoạt động kỹ thuật của hệ thống.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              3. Cửa hàng và nội dung của bạn
            </h2>
            <p>
              Bạn giữ quyền sở hữu đối với sản phẩm, hình ảnh và nội dung mà bạn đăng
              tải. Bạn chịu trách nhiệm về hàng hóa, dịch vụ bạn bán cũng như việc tuân
              thủ quy định pháp luật áp dụng cho hoạt động kinh doanh của mình.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              4. Thanh toán và gói dịch vụ
            </h2>
            <p>
              Một số tính năng có thể yêu cầu trả phí. Các điều khoản về giá, chu kỳ
              thanh toán và hoàn tiền (nếu có) sẽ được thông báo rõ ràng tại thời điểm
              bạn đăng ký gói dịch vụ tương ứng.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Chấm dứt</h2>
            <p>
              Bạn có thể ngừng sử dụng dịch vụ bất cứ lúc nào. Chúng tôi có thể tạm
              ngưng hoặc chấm dứt tài khoản vi phạm các điều khoản này, sau khi thông
              báo trong phạm vi hợp lý nếu có thể.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              6. Thay đổi điều khoản
            </h2>
            <p>
              Chúng tôi có thể cập nhật các điều khoản này theo thời gian. Phiên bản
              mới sẽ có hiệu lực kể từ khi được đăng tải; việc bạn tiếp tục sử dụng dịch
              vụ đồng nghĩa với việc chấp nhận các thay đổi đó.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Liên hệ</h2>
            <p>
              Mọi câu hỏi về điều khoản này, vui lòng liên hệ:{" "}
              <a
                href="mailto:support@omnicommerce.vn"
                className="text-indigo-400 hover:text-indigo-300"
              >
                support@omnicommerce.vn
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-sm">
          <Link href="/legal/privacy" className="text-indigo-400 hover:text-indigo-300">
            Chính sách Bảo mật →
          </Link>
        </div>
      </div>
    </main>
  );
}

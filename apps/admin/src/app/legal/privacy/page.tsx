import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách Bảo mật — OmniCommerce",
  description:
    "Chính sách bảo mật của nền tảng OmniCommerce: thông tin chúng tôi thu thập, cách sử dụng và quyền của bạn.",
};

export default function PrivacyPolicyPage() {
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

        <h1 className="text-3xl font-bold text-white mb-2">Chính sách Bảo mật</h1>
        <p className="text-sm text-slate-500 mb-10">Cập nhật lần cuối: 25/06/2026</p>

        <div className="space-y-8 leading-relaxed text-sm md:text-base">
          <section>
            <p>
              OmniCommerce (&ldquo;chúng tôi&rdquo;) cung cấp nền tảng giúp người bán
              tạo và vận hành cửa hàng trực tuyến. Chính sách này mô tả những thông
              tin chúng tôi thu thập khi bạn sử dụng dịch vụ và cách chúng tôi xử lý
              chúng.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              1. Thông tin chúng tôi thu thập
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-200">Thông tin tài khoản:</strong> tên,
                email, mật khẩu (được băm), và thông tin cửa hàng bạn tạo.
              </li>
              <li>
                <strong className="text-slate-200">Dữ liệu vận hành:</strong> sản phẩm,
                đơn hàng, thông tin khách hàng và nội dung bạn đăng tải lên cửa hàng
                của mình.
              </li>
              <li>
                <strong className="text-slate-200">Dữ liệu kỹ thuật:</strong> địa chỉ
                IP, loại trình duyệt và nhật ký truy cập phục vụ bảo mật và vận hành.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              2. Mục đích sử dụng
            </h2>
            <p>
              Chúng tôi sử dụng thông tin để cung cấp và cải thiện dịch vụ, xử lý đơn
              hàng, gửi thông báo liên quan đến tài khoản (ví dụ email đặt lại mật
              khẩu), bảo vệ nền tảng khỏi gian lận và tuân thủ nghĩa vụ pháp lý.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              3. Chia sẻ thông tin
            </h2>
            <p>
              Chúng tôi không bán thông tin cá nhân của bạn. Thông tin chỉ được chia
              sẻ với các nhà cung cấp dịch vụ cần thiết để vận hành nền tảng (lưu trữ,
              gửi email, xử lý thanh toán) hoặc khi pháp luật yêu cầu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Bảo mật</h2>
            <p>
              Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức hợp lý để bảo vệ dữ
              liệu. Tuy nhiên, không có phương thức truyền tải hay lưu trữ nào an toàn
              tuyệt đối; bạn có trách nhiệm giữ bí mật thông tin đăng nhập của mình.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Quyền của bạn</h2>
            <p>
              Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân của
              mình. Để thực hiện, vui lòng liên hệ với chúng tôi qua thông tin bên
              dưới.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Liên hệ</h2>
            <p>
              Mọi câu hỏi về chính sách này, vui lòng liên hệ:{" "}
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
          <Link href="/legal/terms" className="text-indigo-400 hover:text-indigo-300">
            Điều khoản Dịch vụ →
          </Link>
        </div>
      </div>
    </main>
  );
}

import { Image } from "antd";
import { CircleDollarSign, Download, Home, User } from "lucide-react";
import { Link } from "react-router-dom";

import { ZaloLogoArc } from "@/assets/images";
import { PirateBrandMark } from "@/shared/components/site/BrandMark";

export function PublicFooter() {
  const links = [
    { label: "Trang Chủ", href: "/", icon: <Home size={13} /> },
    {
      label: "Tải Game",
      href: "/download-screen",
      icon: <Download size={13} />,
    },
    { label: "Tài Khoản", href: "/user-account", icon: <User size={13} /> },
    {
      label: "Đổi Coin",
      href: "/doi-coin",
      icon: <CircleDollarSign size={13} />,
    },
  ];

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <PirateBrandMark size={32} />
            <p className="text-sm leading-relaxed text-gray-500">
              Hải tặc vui vẻ là game nhập vai 2D hải tặc trực tuyến. Xây dựng
              nhân vật, trang bị, PK và giải trí cùng bạn bè mỗi ngày.
            </p>
            <div className="mt-1 h-0.5 w-24 bg-gradient-to-r from-amber-400 to-amber-200" />
          </div>
          <div>
            <h4 className="mb-3 text-xs font-700 uppercase tracking-widest text-gray-700">
              Điều Hướng
            </h4>
            <ul className="flex flex-col gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-amber-600"
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-700 uppercase tracking-widest text-gray-700">
              Cộng Đồng
            </h4>
            <p className="mb-3 text-sm text-gray-500">
              Tham gia nhóm Zalo để nhận thông báo cập nhật và hỗ trợ nhanh
              nhất.
            </p>
            <a
              href="https://zalo.me/g/cclw6mvkgskdtmkfj9ik"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            >
              <Image
                height={16}
                width={16}
                preview={false}
                alt="Zalo Logo"
                src={ZaloLogoArc}
              />
              Zalo Community
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

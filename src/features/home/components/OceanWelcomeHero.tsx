import { Users, Ship, Sword, Download } from "lucide-react";
import { Link } from "react-router-dom";

const OceanWelcomeHero = () => {
  const stats = [
    {
      icon: <Users size={20} />,
      value: "48,291",
      label: "Tài Khoản",
      color: "text-teal-600",
    },
    {
      icon: <Ship size={20} />,
      value: "1,247",
      label: "Online Ngay",
      color: "text-amber-600",
    },
    {
      icon: <Sword size={20} />,
      value: "312",
      label: "Guild Hoạt Động",
      color: "text-red-500",
    },
    {
      icon: <Download size={20} />,
      value: "1.4.2",
      label: "Phiên Bản",
      color: "text-gray-500",
    },
  ];
  
  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 pt-16">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#d97706 1px, transparent 1px), linear-gradient(90deg, #d97706 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(ellipse, rgba(251,191,36,0.25) 0%, transparent 70%)",
          }}
        />
        <div className="absolute left-8 top-24 h-32 w-32 rounded-full border border-amber-400 opacity-10" />
        <div className="absolute left-16 top-32 h-16 w-16 rounded-full border border-amber-400 opacity-10" />
        <div className="absolute right-8 top-24 h-32 w-32 rounded-full border border-amber-400 opacity-10" />
        <div className="absolute right-16 top-32 h-16 w-16 rounded-full border border-amber-400 opacity-10" />
      </div>
      <div className="relative z-10 mx-auto max-w-screen-2xl px-4 py-20 text-center sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-600 text-amber-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
          Server Online · 1,247 người đang chơi
        </div>
        <h1 className="text-hero-xl mb-4 text-gray-800">
          <span className="text-amber-600">Pirate</span>MMO
        </h1>
        <h2 className="text-hero-md mb-6 font-500 text-gray-500">
          Đại Dương Huyền Thoại
        </h2>
        <div className="mx-auto mb-8 h-0.5 w-24 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
          Tham gia cuộc phiêu lưu hải tặc vĩ đại nhất. Chinh phục đại dương, xây
          dựng hạm đội, tranh đấu cùng hàng nghìn người chơi trên khắp Việt Nam.
        </p>
        <div className="mb-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/download-screen"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-200 transition-all hover:-translate-y-0.5 hover:bg-amber-600"
          >
            <Download size={18} />
            Tải Game Ngay
          </Link>
          <Link
            to="/sign-up-login-screen"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-white px-8 py-3.5 text-base font-semibold text-amber-600 transition-all hover:border-amber-500 hover:bg-amber-50"
          >
            <Users size={18} />
            Đăng Ký Tài Khoản
          </Link>
        </div>
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <span className={stat.color}>{stat.icon}</span>
              <span className="font-mono text-xl font-700 text-gray-800">
                {stat.value}
              </span>
              <span className="text-xs font-500 text-gray-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-30">
        <div className="h-8 w-px bg-gradient-to-b from-transparent to-amber-500" />
        <span className="text-xs text-gray-500">Cuộn xuống</span>
      </div>
    </section>
  );
}

export default OceanWelcomeHero;
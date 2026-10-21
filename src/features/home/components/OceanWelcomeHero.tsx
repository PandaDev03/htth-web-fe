import { Download, Users } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAppSelector } from "@/app/store/hooks";
import { PATH } from "@/shared/config/path";
import { PageMascot, type MascotReaction } from "@/shared/components/mascot/PageMascot";

const DOWNLOAD_REACTIONS: MascotReaction[] = [
  "blink", "sparkle", "heart", "wink", "bashful", "delighted",
];
const MASCOT_ASSET_ROOT = `${import.meta.env.BASE_URL}mascots/`;

const OceanWelcomeHero = () => {
  const isAuthenticated = useAppSelector((state) =>
    Boolean(state.auth.accessToken),
  );

  const [downloadReaction, setDownloadReaction] = useState<MascotReaction | null>(null);
  const downloadInteraction = useRef({ hover: false, focus: false });

  const updateDownloadInteraction = (kind: "hover" | "focus", active: boolean) => {
    const interaction = downloadInteraction.current;
    const wasActive = interaction.hover || interaction.focus;
    interaction[kind] = active;
    const isActive = interaction.hover || interaction.focus;
    if (isActive && !wasActive) {
      setDownloadReaction(DOWNLOAD_REACTIONS[Math.floor(Math.random() * DOWNLOAD_REACTIONS.length)]);
    } else if (!isActive) {
      setDownloadReaction(null);
    }
  };

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
      <div className="relative z-10 mx-auto max-w-screen-2xl px-4 py-8 text-center sm:px-6 sm:py-12 lg:px-8 xl:px-10">
        <div className="mx-auto h-32 w-32 sm:h-40 sm:w-40">
          <PageMascot
            directions={`${MASCOT_ASSET_ROOT}luffy-directions.webp`}
            reactions={`${MASCOT_ASSET_ROOT}luffy-reactions.webp`}
            reaction={downloadReaction}
            size="100%"
            label="Luffy"
            className="focus-visible:outline-amber-600"
          />
        </div>
        <h1 className="text-hero-xl mb-3 text-gray-800 capitalize sm:mb-4">
          Hải tặc<span className="text-amber-600"> vui vẻ</span>
        </h1>
        <h2 className="text-hero-md mb-4 font-500 text-gray-500 sm:mb-6">
          Game 2D nhập vai hải tặc
        </h2>
        <div className="mx-auto mb-5 h-0.5 w-24 sm:mb-8 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
        <p className="mx-auto mb-6 max-w-2xl text-sm leading-6 text-gray-500 sm:mb-8 sm:text-base sm:leading-relaxed lg:text-lg">
          Xây dựng nhân vật theo cách của bạn, săn trang bị, lập bang hội và PK
          cùng bạn bè trong một thế giới hải tặc 2D vui nhộn và giải trí mỗi
          ngày.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to={PATH.DOWNLOAD}
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") updateDownloadInteraction("hover", true);
            }}
            onPointerLeave={() => updateDownloadInteraction("hover", false)}
            onFocus={() => updateDownloadInteraction("focus", true)}
            onBlur={() => updateDownloadInteraction("focus", false)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-200 transition-all hover:-translate-y-0.5 hover:bg-amber-600 hover:text-white"
          >
            <Download size={18} />
            Tải Game Ngay
          </Link>
          {!isAuthenticated && (
            <Link
              to={{ pathname: PATH.AUTH, search: "?mode=register" }}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-white px-8 py-3.5 text-base font-semibold text-amber-600 transition-all hover:border-amber-500 hover:bg-amber-50 hover:text-amber-600"
            >
              <Users size={18} />
              Đăng Ký Tài Khoản
            </Link>
          )}
        </div>
        {/* <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
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
        </div> */}
      </div>
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-30">
        <div className="h-8 w-px bg-gradient-to-b from-transparent to-amber-500" />
      </div>
    </section>
  );
};

export default OceanWelcomeHero;

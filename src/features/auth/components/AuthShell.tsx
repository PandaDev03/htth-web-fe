import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { PirateBrandMark } from "@/shared/components/site/BrandMark";
import { PATH } from "@/shared/config/path";

export function PirateAuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-5 sm:px-6 sm:py-7">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#d97706 1px, transparent 1px), linear-gradient(90deg, #d97706 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-[430px] w-[min(900px,95vw)] -translate-x-1/2 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(ellipse, rgba(251,191,36,0.28) 0%, transparent 68%)",
          }}
        />
        <div className="absolute left-1/2 top-[46%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/25" />
        <div className="absolute left-1/2 top-[46%] h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/20" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/90 blur-2xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-amber-50/90 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-white/90 blur-2xl" />
      </div>

      <Link
        to={PATH.HOME}
        aria-label="Về trang chủ Hải tặc vui vẻ"
        className="relative z-20 inline-flex rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-4 motion-reduce:transition-none"
      >
        <PirateBrandMark size={40} />
      </Link>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-md flex-col items-center justify-center py-8 sm:py-10">
        <section className="w-full overflow-hidden rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_26px_80px_rgba(146,100,28,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}

import { WheelLogo } from "@/assets/images";
import { Image } from "antd";

interface BrandMarkProps {
  size?: number;
  showText?: boolean;
  dark?: boolean;
}

export function PirateBrandMark({
  size = 36,
  showText = true,
  dark = false,
}: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* <img
        src="/assets/images/app_logo.ico"
        width={size}
        height={size}
        alt=""
        className="shrink-0 rounded-full object-cover"
      /> */}
      <Image
        width={size}
        height={size}
        alt="wheel-logo"
        preview={false}
        src={WheelLogo}
      />
      {showText && (
        <span className="flex flex-col">
          <span
            className={
              "font-sans text-lg font-800 capitalize leading-tight " +
              (dark ? "text-gold" : "text-amber-600")
            }
          >
            Hải tặc vui vẻ
          </span>
          <span
            className={
              "text-2xs leading-none " +
              (dark ? "text-muted-foreground" : "text-gray-400")
            }
          >
            Game 2D nhập vai hải tặc
          </span>
        </span>
      )}
    </span>
  );
}

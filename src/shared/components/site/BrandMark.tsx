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
      <img
        src="/assets/images/app_logo.ico"
        width={size}
        height={size}
        alt=""
        className="shrink-0 rounded-full object-cover"
      />
      {showText && (
        <span className="flex flex-col">
          <span
            className={`font-sans text-lg font-800 leading-tight ${dark ? "text-gold" : "text-amber-600"}`}
          >
            PirateMMO
          </span>
          <span
            className={`text-2xs leading-none ${dark ? "text-muted-foreground" : "text-gray-400"}`}
          >
            Hải Tặc Huyền Thoại
          </span>
        </span>
      )}
    </span>
  );
}

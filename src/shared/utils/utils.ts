export const scrollToTop = ({
  behavior = "smooth",
}: {
  behavior?: ScrollBehavior;
}) => {
  window.scrollTo({
    top: 0,
    behavior,
  });
};

export const formatNumber = (value: number) => value.toLocaleString("vi-VN");

export const formatDateTime = (value: string) => {
  const match = value?.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (match) {
    const [, year, month, day, hour, minute, second = "00"] = match;
    return `${hour}:${minute}:${second} ${day}/${month}/${year}`;
  }

  return new Date(value)?.toLocaleString("vi-VN", { hour12: false });
};

// Adapted from nilbuild/page-mascot. MIT copyright/license: ./LICENSE.
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const DIRECTIONS = [
  "up-left", "up", "up-right",
  "left", "center", "right",
  "down-left", "down", "down-right",
] as const;
const REACTIONS = [
  "blink", "heart", "sparkle",
  "surprised", "wink", "bashful",
  "sleepy", "dizzy", "delighted",
] as const;

type Direction = (typeof DIRECTIONS)[number];
export type MascotReaction = (typeof REACTIONS)[number];

const CLOCKWISE: Direction[] = [
  "right", "down-right", "down", "down-left",
  "left", "up-left", "up", "up-right",
];
const SECTOR = Math.PI / 4;
const PAYOFFS: MascotReaction[] = ["heart", "sparkle", "delighted"];
const SQUASH: Keyframe[] = [
  { transform: "scale(1, 1)", easing: "ease-in" },
  { transform: "scale(1.10, 0.86)", offset: 0.18, easing: "ease-out" },
  { transform: "scale(0.95, 1.08)", offset: 0.45, easing: "ease-in-out" },
  { transform: "scale(1.03, 0.97)", offset: 0.72, easing: "ease-in-out" },
  { transform: "scale(1, 1)" },
];
const layer: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "300% 300%",
  backgroundRepeat: "no-repeat",
  pointerEvents: "none",
};

function cell(index: number): CSSProperties {
  return {
    backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
  };
}

interface PageMascotProps {
  directions: string;
  reactions: string;
  /** A reaction held by another control, e.g. a hovered or focused CTA. */
  reaction?: MascotReaction | null;
  size?: CSSProperties["width"];
  className?: string;
  label?: string;
}

export function PageMascot({
  directions,
  reactions,
  reaction = null,
  size = 160,
  className,
  label = "Luffy",
}: PageMascotProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const squashRef = useRef<HTMLSpanElement>(null);
  const timersRef = useRef<number[]>([]);
  const animationRef = useRef<Animation | null>(null);
  const boopsRef = useRef({ count: 0, at: 0 });
  const [direction, setDirection] = useState<Direction>("center");
  const [clickReaction, setClickReaction] = useState<MascotReaction | null>(null);
  const activeReaction = reaction ?? clickReaction;

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let sector = -1;
    let previousDirection: Direction = "center";
    let pointer: { x: number; y: number } | null = null;
    let visible = true;

    // Only the discrete direction changes React state, never raw pointer coordinates.
    const update = (next: Direction) => {
      if (next !== previousDirection) {
        previousDirection = next;
        setDirection(next);
      }
    };
    const reset = () => {
      pointer = null;
      sector = -1;
      update("center");
    };
    const aim = () => {
      const button = buttonRef.current;
      if (!button || !pointer || !visible || !finePointer.matches) return;
      const box = button.getBoundingClientRect();
      const dx = pointer.x - box.left - box.width / 2;
      const dy = pointer.y - box.top - box.height / 2;
      if (Math.hypot(dx, dy) < 70) {
        sector = -1;
        update("center");
        return;
      }
      const angle = Math.atan2(dy, dx);
      const delta = angle - sector * SECTOR;
      if (sector !== -1 &&
        Math.abs(Math.atan2(Math.sin(delta), Math.cos(delta))) < SECTOR / 2 + 0.12) return;
      sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length;
      update(CLOCKWISE[sector]);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !finePointer.matches) return;
      pointer = { x: event.clientX, y: event.clientY };
      aim();
    };
    const onPointerChange = () => {
      if (!finePointer.matches) reset();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    });
    if (buttonRef.current) observer.observe(buttonRef.current);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", aim, { passive: true });
    window.addEventListener("blur", reset);
    document.documentElement.addEventListener("pointerleave", reset);
    finePointer.addEventListener("change", onPointerChange);
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", aim);
      window.removeEventListener("blur", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
      finePointer.removeEventListener("change", onPointerChange);
    };
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(window.clearTimeout);
      animationRef.current?.cancel();
    };
  }, []);

  const boop = () => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current.length = 0;
    const later = (ms: number, next: MascotReaction | null) => {
      timersRef.current.push(window.setTimeout(() => setClickReaction(next), ms));
    };
    const now = Date.now();
    const boops = boopsRef.current;
    boops.count = now - boops.at < 1600 ? boops.count + 1 : 1;
    boops.at = now;
    if (boops.count >= 4) {
      boops.count = 0;
      setClickReaction("dizzy");
      later(1100, null);
    } else {
      setClickReaction("blink");
      later(120, PAYOFFS[(boops.count - 1) % PAYOFFS.length]);
      later(560, null);
    }
    animationRef.current?.cancel();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animationRef.current =
        squashRef.current?.animate(SQUASH, { duration: 420, easing: "linear" }) ?? null;
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={boop}
      aria-label={`Chào ${label}`}
      className={className}
      data-mascot-direction={direction}
      data-mascot-reaction={activeReaction ?? ""}
      style={{
        position: "relative",
        display: "block",
        flexShrink: 0,
        width: size,
        height: size,
        padding: 0,
        border: 0,
        borderRadius: 16,
        background: "transparent",
        appearance: "none",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span
        ref={squashRef}
        aria-hidden="true"
        style={{ position: "relative", display: "block", width: "100%", height: "100%", transformOrigin: "50% 90%" }}
      >
        <span
          style={{
            ...layer,
            backgroundImage: `url("${directions}")`,
            ...cell(DIRECTIONS.indexOf(direction)),
            opacity: activeReaction ? 0 : 1,
          }}
        />
        {/* Mount both atlases immediately so the first reaction is already cached. */}
        <span
          style={{
            ...layer,
            backgroundImage: `url("${reactions}")`,
            ...cell(REACTIONS.indexOf(activeReaction ?? "blink")),
            opacity: activeReaction ? 1 : 0,
          }}
        />
      </span>
    </button>
  );
}

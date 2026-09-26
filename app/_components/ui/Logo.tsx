import { useId } from "react";

type LogoProps = {
  /** "full" shows the mark and wordmark; "mark" shows only the icon. */
  variant?: "full" | "mark";
  /** Wordmark colour: light on dark backgrounds, dark on light ones. */
  tone?: "light" | "dark";
  size?: number;
  className?: string;
};

// Coinsight mark: a coin whose opening holds an "insight" sparkle.
export function LogoMark({ size = 32 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1d5e5b" />
          <stop offset="1" stopColor="#3a9a8f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M21.93 21A8 8 0 1 1 17.74 9.48"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M23.5 5.5c.4 2.8 1.2 3.6 4 4-2.8.4-3.6 1.2-4 4-.4-2.8-1.2-3.6-4-4 2.8-.4 3.6-1.2 4-4Z"
        fill="#f2cdac"
      />
    </svg>
  );
}

function Logo({
  variant = "full",
  tone = "light",
  size = 32,
  className = "",
}: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="Coinsight"
      role="img"
    >
      <LogoMark size={size} />
      {variant === "full" ? (
        <span
          className={`font-extrabold tracking-tight leading-none ${
            tone === "light" ? "text-white" : "text-grey-900"
          }`}
          style={{ fontSize: size * 0.7 }}
        >
          Coin
          <span
            className={
              tone === "light" ? "text-secondary-cyan" : "text-secondary-green"
            }
          >
            sight
          </span>
        </span>
      ) : null}
    </span>
  );
}

export default Logo;

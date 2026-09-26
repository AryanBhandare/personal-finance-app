import React from "react";

type buttonProps = {
  children: React.ReactNode;
  type?: string;
  onClick?: () => void;
  className?: string;
};

function Button({
  children,
  type = "primary",
  onClick,
  className,
}: buttonProps) {
  return (
    <button
      className={`font-semibold text-sm rounded-xl px-5 py-3.5 items-center flex gap-2 border transition-all duration-200 active:scale-[0.98] max-h-[60px] ${
        type === "primary"
          ? "bg-grey-900 border-grey-900 text-beige-100 shadow-sm hover:bg-grey-900/85 hover:shadow-md"
          : type === "secondary"
          ? "bg-beige-100 border-transparent text-grey-900 hover:bg-secondary-white hover:border-grey-900/80"
          : type === "tertiary"
          ? "border-transparent text-grey-500 hover:text-grey-900"
          : type === "danger"
          ? "bg-secondary-red border-secondary-red text-beige-100 shadow-sm hover:bg-secondary-red/85"
          : ""
      } capitalize ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;

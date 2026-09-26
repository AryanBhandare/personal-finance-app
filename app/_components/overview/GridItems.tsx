import Link from "next/link";
import { ReactNode } from "react";
import leftArr from "@/public/assets/images/icon-caret-right.svg";
import Image from "next/image";
type gridItems = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
};

function GridItems({ children, className }: gridItems) {
  return (
    <div
      className={`bg-secondary-white rounded-2xl w-full p-5 md:p-6 z-20 border border-grey-900/[0.04] shadow-card transition-shadow duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export function FlexItems({ children, className }: gridItems) {
  return (
    <div
      className={`flex justify-between items-center gap-4 w-full ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}

type linkProps = {
  href: string;
  children: ReactNode;
};

export function LinkButton({ href, children }: linkProps) {
  return (
    <Link
      href={href}
      className="group flex gap-3 items-center text-sm text-grey-500 hover:text-grey-900 transition-colors whitespace-nowrap"
    >
      <p>{children}</p>
      <div className="relative h-3 w-3 transition-transform duration-200 group-hover:translate-x-1">
        <Image src={leftArr} alt="" fill />
      </div>
    </Link>
  );
}
export function HeaderGrid({ children, icon }: gridItems) {
  return (
    <h3 className="flex items-center gap-3 min-w-0 text-lg md:text-xl font-bold tracking-tight text-grey-900 my-2">
      {icon ? (
        <span className="h-9 w-9 rounded-xl bg-beige-100 text-grey-900 flex items-center justify-center shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </h3>
  );
}

export default GridItems;

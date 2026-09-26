"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { item, navList } from "./LeftNav";

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-3 left-3 right-3 h-16 md:h-[72px] lg:hidden flex justify-between items-center gap-1 bg-grey-900/95 backdrop-blur-md rounded-2xl shadow-pop px-2 md:px-6 z-50">
      {navList.map((item, index) => (
        <AsideItem key={index} items={item} active={pathname === item.href} />
      ))}
    </nav>
  );
}

function AsideItem({ items, active }: item) {
  const { Icon } = items;
  return (
    <Link
      href={items.href}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl flex-1 max-w-[104px] h-12 md:h-14 px-2 transition-all duration-300 ${
        active
          ? "bg-secondary-green text-white shadow-[0_8px_24px_-6px_rgba(39,124,120,0.6)]"
          : "text-grey-300 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <Icon size={20} className="shrink-0" />
      <p className="text-[11px] font-semibold whitespace-nowrap md:flex hidden">
        {items.name}
      </p>
    </Link>
  );
}

export default BottomNav;

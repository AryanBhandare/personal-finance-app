"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  LuArrowLeftRight,
  LuCalendarClock,
  LuLayoutDashboard,
  LuPieChart,
  LuPiggyBank,
  LuSettings,
} from "react-icons/lu";
import { IconType } from "react-icons";
import logo from "@/public/assets/images/logo-large.svg";
import logosm from "@/public/assets/images/logo-small.svg";

import hideMenuIcon from "@/public/assets/images/icon-minimize-menu.svg";

export type item = {
  items: itemsProp;
  active?: boolean;
  menuShown?: boolean;
};

type itemsProp = {
  name: string;
  Icon: IconType;
  href: string;
};

export const navList = [
  { name: "Overview", Icon: LuLayoutDashboard, href: "/" },
  { name: "Transactions", Icon: LuArrowLeftRight, href: "/transactions" },
  { name: "Budgets", Icon: LuPieChart, href: "/budgets" },
  { name: "Pots", Icon: LuPiggyBank, href: "/pots" },
  { name: "Recurring Bills", Icon: LuCalendarClock, href: "/recurring_bills" },
  { name: "Settings", Icon: LuSettings, href: "/settings" },
];

type navProp = {
  menuSow: boolean;
  handleMenuShow: () => void;
};
function LeftNav({ menuSow, handleMenuShow }: navProp) {
  const pathname = usePathname();
  return (
    <aside
      className={`fixed left-3 top-3 bottom-3 overflow-hidden bg-gradient-to-b from-grey-900 to-[#16151a] rounded-3xl shadow-pop lg:flex flex-col justify-between py-9 ${
        menuSow ? "xl:w-[300px] lg:w-[240px]" : "lg:w-[88px]"
      } transition-all duration-500 hidden z-50`}
    >
      <span className="pointer-events-none absolute -left-20 -bottom-24 h-64 w-64 rounded-full bg-secondary-green/20 blur-3xl" />
      <div
        className={`relative flex flex-col gap-14 ${
          menuSow ? "" : "justify-center items-center"
        }`}
      >
        <div
          className={`relative h-[22px] ${
            menuSow ? "ml-8 w-[121px] " : " w-[24px]"
          }`}
        >
          <Image src={menuSow ? logo : logosm} alt="logo image" fill />
        </div>

        <div className="flex flex-col gap-1.5">
          {menuSow ? (
            <p className="ml-8 mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-grey-500">
              Menu
            </p>
          ) : null}
          {navList.map((item, index) => (
            <AsideItem
              key={index}
              items={item}
              active={pathname === item.href}
              menuShown={menuSow}
            />
          ))}
        </div>
      </div>
      <button
        className={`group relative flex ${
          menuSow ? "ml-8" : "mx-auto"
        } gap-4 items-center text-grey-300 hover:text-beige-100 transition-colors`}
        onClick={handleMenuShow}
        aria-label={menuSow ? "Minimize menu" : "Expand menu"}
      >
        <div
          className={`relative w-6 h-6 opacity-70 group-hover:opacity-100 transition-all duration-500 ${
            menuSow ? "" : "rotate-180"
          }`}
        >
          <Image src={hideMenuIcon} alt="hide menu icon" fill />
        </div>
        <p
          className={`font-semibold transition-all duration-500 ${
            menuSow ? "flex" : "hidden"
          }`}
        >
          Minimize Menu
        </p>
      </button>
    </aside>
  );
}

function AsideItem({ items, active, menuShown }: item) {
  const { Icon } = items;
  return (
    <Link
      href={items.href}
      title={menuShown ? undefined : items.name}
      className={`group relative flex items-center gap-3 rounded-xl h-12 transition-all duration-300 ${
        menuShown ? "mx-4 px-4" : "mx-auto w-12 justify-center"
      } ${
        active
          ? "bg-secondary-green text-white shadow-[0_8px_24px_-6px_rgba(39,124,120,0.6)]"
          : "text-grey-300 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <Icon
        size={20}
        className={`shrink-0 transition-transform duration-300 ${
          active ? "" : "group-hover:scale-110"
        }`}
      />
      <p
        className={`text-sm font-semibold whitespace-nowrap ${
          menuShown ? "flex" : "hidden"
        }`}
      >
        {items.name}
      </p>
    </Link>
  );
}

export default LeftNav;

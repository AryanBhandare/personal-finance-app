import { formatCurrency } from "@/app/_lib/dats-services";
import Image from "next/image";
import { LuArrowDownLeft, LuArrowUpRight, LuWallet } from "react-icons/lu";

type balanceItemType = {
  balance: number;
  title: string;
  image?: string;
};

const cardStyles: Record<
  string,
  { card: string; chip: string; icon?: JSX.Element; dark: boolean }
> = {
  "Current Balance": {
    card: "bg-gradient-to-br from-[#1d5e5b] via-secondary-green to-[#3a9a8f] shadow-[0_20px_48px_-16px_rgba(39,124,120,0.7)]",
    chip: "bg-white/15 text-white ring-1 ring-white/20",
    icon: <LuWallet size={18} />,
    dark: true,
  },
  "Total Bills": {
    card: "bg-gradient-to-br from-grey-900 via-grey-900 to-[#2f2d35] shadow-pop",
    chip: "bg-white/10 text-white",
    dark: true,
  },
  Income: {
    card: "bg-secondary-white border border-grey-900/[0.04] shadow-card hover:shadow-card-hover",
    chip: "bg-secondary-green/10 text-secondary-green",
    icon: <LuArrowDownLeft size={18} />,
    dark: false,
  },
  Expenses: {
    card: "bg-secondary-white border border-grey-900/[0.04] shadow-card hover:shadow-card-hover",
    chip: "bg-secondary-red/10 text-secondary-red",
    icon: <LuArrowUpRight size={18} />,
    dark: false,
  },
};

function BalanceItem({ balance, title, image }: balanceItemType) {
  const style = cardStyles[title] ?? cardStyles.Income;
  const isDark = style.dark;

  return (
    <div
      className={`relative overflow-hidden flex flex-col gap-3 w-full p-5 md:p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 ${
        title === "Current Balance" ? "sm:col-span-2 md:col-span-1" : ""
      } ${style.card}`}
    >
      {isDark ? (
        <>
          <span
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "18px 18px",
              maskImage: "linear-gradient(to left, black, transparent 70%)",
              WebkitMaskImage:
                "linear-gradient(to left, black, transparent 70%)",
            }}
          />
          <span className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        </>
      ) : null}

      <div className="relative flex items-center justify-between mb-2 md:mb-4">
        {image ? (
          <span className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <span className="w-6 h-6 relative">
              <Image src={image} alt="Recurring" fill />
            </span>
          </span>
        ) : (
          <span
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${style.chip}`}
          >
            {style.icon}
          </span>
        )}
      </div>

      <p
        className={`relative ${
          isDark ? "text-white/75" : "text-grey-500"
        } text-sm font-medium`}
      >
        {title}
      </p>

      <h2
        className={`relative ${
          isDark ? "text-white" : "text-grey-900"
        } text-[26px] sm:text-[30px] xl:text-[34px] leading-none break-all font-extrabold tracking-tight tabular-nums`}
      >
        {formatCurrency(balance).replace("-", "")}
      </h2>
    </div>
  );
}

export default BalanceItem;

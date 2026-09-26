import { formatCurrency, formatDateTime } from "@/app/_lib/dats-services";
import { Item } from "../overview/Transactions";
import Image from "next/image";
import defaultImg from "@/public/assets/images/avatars/ecofuel-energy.jpg";
function TransactionsItem({ item }: Item) {
  return (
    <>
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <span className="relative w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 ring-1 ring-grey-900/5">
          <Image
            src={
              item?.avatar && item?.avatar?.startsWith(".")
                ? item.avatar.replace(".", "")
                : !item.avatar
                ? defaultImg
                : item.avatar
            }
            alt="User Avatar"
            fill
            className="rounded-full"
          />
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-grey-900 text-sm font-bold truncate">{item.name}</p>
          <p className="text-grey-500 text-xs md:hidden">{item.category}</p>
        </div>
      </div>

      <p className="text-grey-500 text-xs hidden md:flex items-center">
        <span className="rounded-full bg-beige-100 px-2.5 py-1">
          {item.category}
        </span>
      </p>

      <p className="text-grey-500 text-xs hidden md:flex items-center">
        {formatDateTime(item.date)}
      </p>

      <div className="flex flex-col gap-1 items-end justify-center">
        <p
          className={`font-bold tabular-nums ${
            item.amount > 0 ? "text-secondary-green" : "text-grey-900"
          } text-sm`}
        >
          {item.amount > 0
            ? `+${formatCurrency(item.amount)}`
            : formatCurrency(item.amount)}
        </p>
        <p className="text-grey-500 md:hidden text-xs">
          {formatDateTime(item.date)}
        </p>
      </div>
    </>
  );
}

export default TransactionsItem;

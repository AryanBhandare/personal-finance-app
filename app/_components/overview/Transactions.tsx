import { formatCurrency, formatDateTime } from "@/app/_lib/dats-services";
import Image from "next/image";
import defaultImg from "@/public/assets/images/avatars/flavor-fiesta.jpg";

export type transactionsProp = {
  transactions: TrxType[];
};

function Transactions({ transactions }: transactionsProp) {
  return (
    <div>
      {transactions?.slice(0, 5).map((trx) => (
        <TransactionItem key={trx.date} item={trx} />
      ))}
    </div>
  );
}

export type TrxType = {
  avatar: string;
  name: string;
  category?: string;
  date: string;
  amount: number;
  recurring?: boolean;
  status?: string;
};

export type Item = {
  item: TrxType;
};

export function TransactionItem({ item }: Item) {
  return (
    <div className="flex justify-between items-center gap-4 border-b border-b-beige-100 last:border-b-0 py-4 px-2 -mx-2 rounded-lg transition-colors hover:bg-beige-100/60">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <span className="relative w-10 h-10 rounded-full shrink-0 ring-1 ring-grey-900/5">
          <Image
            src={
              item.avatar && item?.avatar?.startsWith(".")
                ? item?.avatar?.replace(".", "")
                : !item.avatar
                ? defaultImg
                : item?.avatar
            }
            alt="User Avatar"
            fill
            className="rounded-full"
          />
        </span>

        <p className="text-sm font-bold text-grey-900 truncate">{item?.name}</p>
      </div>
      <div className="flex flex-col gap-1 items-end shrink-0">
        <p
          className={`text-sm font-bold tabular-nums ${
            item.amount > 0 ? "text-secondary-green" : "text-grey-900"
          }`}
        >
          {item?.amount > 0
            ? `+${formatCurrency(item?.amount)}`
            : formatCurrency(item?.amount)}
        </p>
        <p className="text-xs text-grey-500">{formatDateTime(item.date)}</p>
      </div>
    </div>
  );
}

export default Transactions;

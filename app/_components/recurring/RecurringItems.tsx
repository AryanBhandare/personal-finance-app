"use client";

import { formatCurrency, formatDateTime } from "@/app/_lib/dats-services";
import GridItems from "../overview/GridItems";
import { SearchBar, Sort } from "../transactions/Filter";
import Image from "next/image";
import curDateImg from "@/public/assets/images/icon-bill-paid.svg";

import curDueImg from "@/public/assets/images/icon-bill-due.svg";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TransactionProps } from "../transactions/Transaction";
import { TrxType } from "../overview/Transactions";

export type Item = {
  avatar: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  recurring?: boolean;
  status?: string;
};

type TransactionProp = {
  transactions: Item[];
};

const sortOptions = [
  "Latest",
  "Oldest",
  "A to Z",
  "Z to A",
  "Highest",
  "Lowest",
] as const;

function RecurringItems({ transactions }: TransactionProp) {
  const router = useRouter();
  const pathname = usePathname();
  const [sorts, setSorts] = useState({
    value: "Latest",
    isOpen: false,
  });
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sort = params.get("sort") || "Latest";
    setSorts({ value: sort, isOpen: false });
  }, []);

  function updateUrlParams(filterType: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set(filterType, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSort(cateSort: string) {
    setSorts({ value: cateSort, isOpen: false });
    updateUrlParams("sort", cateSort);
  }

  function handleOpenSort() {
    setSorts((sort) => ({ ...sort, isOpen: !sort.isOpen }));
  }

  const recTransactions = transactions.filter((trx) => trx.recurring === true);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchQuery) {
      filtered = filtered.filter(
        (trx: TrxType) =>
          trx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trx.category?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    switch (sorts.value) {
      case "Oldest":
        filtered = filtered.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        break;
      case "A to Z":
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Z to A":
        filtered = filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "Highest":
        filtered = filtered.sort((a, b) => b.amount - a.amount);
        break;
      case "Lowest":
        filtered = filtered.sort((a, b) => a.amount - b.amount);
        break;
      case "Latest":
      default:
        filtered = filtered.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        break;
    }

    return filtered;
  }, [sorts.value, searchQuery, transactions]);

  function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.target.value;
    setSearchQuery(query);
  }

  function handleCateOrSort(type: string, cateSort: string) {
    if (type === "sort") {
      setSorts({ value: cateSort, isOpen: false });
      updateUrlParams("sort", cateSort);
    }
  }

  return (
    <GridItems>
      <div className="w-full grid grid-cols-[minmax(0,1fr),auto] gap-x-4 md:gap-x-8 gap-y-6 relative">
        <div className="min-w-0 md:max-w-[320px]">
          <SearchBar searchQuery={searchQuery} handleSearch={handleSearch} />
        </div>
        <div className="flex justify-end">
          <Sort
            sortState={sorts}
            handleCateSort={handleOpenSort}
            menu={
              sorts.isOpen && (
                <GridItems className="absolute right-0 top-full mt-2 !w-48 max-h-[60vh] overflow-y-auto shadow-pop animate-scale-in !p-1.5 z-50">
                  {sortOptions.map((sort) => (
                    <button
                      key={sort}
                      className="py-2.5 px-3 rounded-lg text-sm text-left hover:bg-beige-100 w-full"
                      onClick={() => handleCateOrSort("sort", sort)}
                    >
                      {sort}
                    </button>
                  ))}
                </GridItems>
              )
            }
          />
        </div>
        <div className="col-span-full h-px bg-beige-100" />

        {/* transactions */}

        {filteredTransactions.map((trx, i) => (
          <RecItemsItem key={i} item={trx} />
        ))}
      </div>
    </GridItems>
  );
}

type RecItem = {
  item: Item;
};

function getRecDayPerMonth(date: string) {
  const dateToFormat = formatDateTime(date, true);

  let formattedStr = "";

  if (typeof dateToFormat === "number") {
    if (dateToFormat === 1 || dateToFormat === 21 || dateToFormat === 31) {
      formattedStr = dateToFormat + "st";
    } else if (dateToFormat === 2 || dateToFormat === 22) {
      formattedStr = dateToFormat + "nd";
    } else if (dateToFormat === 3 || dateToFormat === 23) {
      formattedStr = dateToFormat + "rd";
    } else {
      formattedStr = dateToFormat + "th";
    }
  }

  return formattedStr;
}

function RecItemsItem({ item }: RecItem) {
  return (
    <>
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <span className="relative w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 ring-1 ring-grey-900/5">
          <Image
            src={item.avatar.replace(".", "")}
            alt="User Avatar"
            fill
            className="rounded-full"
          />
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-grey-900 text-sm font-bold truncate">
            {item.name}
          </p>
        </div>
      </div>

      <div className="flex justify-end md:justify-between md:items-center flex-col md:flex-row md:gap-8">
        <span className=" grid-cols-[120px,20px] md:items-center md:justify-center hidden md:grid">
          <p className="text-xs hidden md:flex text-secondary-green">
            Monthly · {getRecDayPerMonth(item.date)}
          </p>
          <div className="flex items-center justify-center">
            <div className="h-4 w-4 relative">
              <Image
                src={item.status === "Paid" ? curDateImg : curDueImg}
                alt="Image icon due"
                fill
              />
            </div>
          </div>
        </span>
        <div className="flex flex-col gap-3 items-end">
          <span className="grid grid-cols-[70px,20px] md:items-center md:justify-center md:hidden">
            <p className="text-secondary-green md:hidden text-[10px]">
              Monthly · {getRecDayPerMonth(item.date)}
            </p>

            <div className="h-4 w-4 relative">
              <Image
                src={item.status === "Paid" ? curDateImg : curDueImg}
                alt="Image icon due"
                fill
              />
            </div>
          </span>
          <p
            className={`font-semibold ${
              item.status === "Paid" ? "text-grey-900" : "text-secondary-red "
            } text-sm font-bold tabular-nums`}
          >
            {item.amount > 0
              ? `+${formatCurrency(item.amount).replace("-", "")}`
              : formatCurrency(item.amount).replace("-", "")}
          </p>
        </div>
      </div>
    </>
  );
}

const recBills = [
  {
    name: "Paid Bills",
    total: 190,
    count: 4,
  },
  {
    name: "Total upcomings",
    total: 194.98,
    count: 4,
  },
  {
    name: "Due soon",
    total: 59.58,
    count: 2,
  },
];

type RecProp = {
  onhandleType?: (
    type: "count" | "total",
    name: "Upcoming" | "Due soon" | "Paid",
  ) => ReactNode;
  transactions: Item[];
};

export function RecurringSummary({ transactions, onhandleType }: RecProp) {
  const calculateNextPaymentDate = (date: Date): Date => {
    const nextPaymentDate = new Date(date);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); // Recurs every month
    return nextPaymentDate;
  };
  const currentDate = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(currentDate.getDate() + 7);

  let uniqueTrxx: Item[] = [];

  const statusesSet = new Set<string>();

  transactions.forEach((trx: Item) => {
    const trxDate = new Date(trx.date);
    const nextPaymentDate = calculateNextPaymentDate(trxDate);

    let status: string;

    if (nextPaymentDate < currentDate) {
      status = "Paid";
    } else if (
      nextPaymentDate >= currentDate &&
      nextPaymentDate <= oneWeekLater
    ) {
      status = "Due soon";
    } else {
      status = "Upcoming";
    }

    if (!statusesSet.has(status)) {
      statusesSet.add(status);
      uniqueTrxx.push({ ...trx, status });
    }
  });

  function getTotalOrCount(
    type: "count" | "total",
    name: "Upcoming" | "Due soon" | "Paid" | string,
  ) {
    if (type === "count") {
      return transactions.filter((trx) => trx.status === name).length;
    } else {
      return transactions
        .filter((trx) => trx.status === name)
        .reduce((acc, val) => acc + val.amount, 0);
    }
  }
  return (
    <GridItems>
      <h1 className="text-xl font-bold tracking-tight mb-3">Summary</h1>
      {uniqueTrxx?.map((bill, i) => (
        <SumItem key={i} bill={bill} onhandleType={getTotalOrCount} />
      ))}
    </GridItems>
  );
}

type recSum = {
  bill: Item;
  onhandleType: (
    type: "count" | "total",
    name: "Upcoming" | "Due soon" | "Paid" | string,
  ) => ReactNode | number;
};

function SumItem({ bill, onhandleType }: recSum) {
  // Assuming onhandleType returns either a number or a ReactNode

  const billst = typeof bill.status === "string" ? bill.status : "";
  const result = onhandleType("total", billst);

  // Use a type guard to ensure it's a number before formatting
  const formattedCurrency =
    typeof result === "number" ? formatCurrency(result) : formatCurrency(0);

  return (
    <div className="flex justify-between items-center border-b border-b-beige-100 last:border-b-0 py-4">
      <p
        className={`${
          bill.status === "Due soon" ? "text-secondary-red" : "text-grey-500"
        } text-sm`}
      >
        {bill.status}
      </p>

      <div className="flex items-center gap-1.5 tabular-nums">
        <span
          className={`${
            bill.status === "Due soon" ? "text-secondary-red" : "text-grey-500"
          } text-xs`}
        >
          {onhandleType("count", bill.status ?? "Upcoming")} ×
        </span>
        <p
          className={`${
            bill.status === "Due soon" ? "text-secondary-red" : "text-grey-900"
          } text-sm font-bold`}
        >
          {formattedCurrency.replace("-", "")}
        </p>
      </div>
    </div>
  );
}
export default RecurringItems;

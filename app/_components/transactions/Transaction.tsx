"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import GridItems from "../overview/GridItems";
import { TransactionItem, TrxType } from "../overview/Transactions";
import Filter, { Title } from "./Filter";
import Pagination from "./Pagination";
import TransactionsItem from "./TransactionsItem";

const sortOptions = [
  "Latest",
  "Oldest",
  "A to Z",
  "Z to A",
  "Highest",
  "Lowest",
] as const;
const defaultCategory = "All categories";

export type TransactionProps = {
  transactions: TrxType[];
};

function Transaction({ transactions }: TransactionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCurPage, setIsCurPage] = useState(1);
  const [cate, setCate] = useState({
    value: defaultCategory,
    isOpen: false,
  });

  const [sorts, setSorts] = useState({
    value: "Latest",
    isOpen: false,
  });

  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") || defaultCategory;
    const sort = params.get("sort") || "Latest";
    setCate({ value: category, isOpen: false });
    setSorts({ value: sort, isOpen: false });
  }, []);

  function updateUrlParams(filterType: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set(filterType, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleCateOrSort(type: string, cateSort: string) {
    if (type === "cate") {
      setCate({ value: cateSort, isOpen: false });
      updateUrlParams("category", cateSort);
    } else if (type === "sort") {
      setSorts({ value: cateSort, isOpen: false });
      updateUrlParams("sort", cateSort);
    }
  }

  function handleOpenCateSort(type: string) {
    if (type === "cate") {
      setCate((cat) => ({ ...cat, isOpen: !cat.isOpen }));
      setSorts((sort) => ({ ...sort, isOpen: false }));
    } else if (type === "sort") {
      setSorts((sort) => ({ ...sort, isOpen: !sort.isOpen }));
      setCate((cat) => ({ ...cat, isOpen: false }));
    }
  }

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(transactions.map((trx) => trx.category)),
    );
    return [defaultCategory, ...uniqueCategories];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (cate.value !== defaultCategory) {
      filtered = filtered.filter((trx) => trx.category === cate.value);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (trx) =>
          (trx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trx.category?.toLowerCase().includes(searchQuery.toLowerCase())) ??
          false,
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
  }, [cate.value, sorts.value, transactions, searchQuery]);

  const MAX_PER_PAGE = 10;
  const numPages = Math.ceil(filteredTransactions.length / MAX_PER_PAGE);
  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  const getTransactionsForPage = useCallback(
    (page: number) => {
      const startIndex = (page - 1) * MAX_PER_PAGE;
      return filteredTransactions.slice(startIndex, startIndex + MAX_PER_PAGE);
    },
    [filteredTransactions],
  );

  function handlePagination(type: string) {
    if (type === "next" && isCurPage < pages.length) {
      setIsCurPage(isCurPage + 1);
    } else if (type === "prev" && isCurPage > 1) {
      setIsCurPage(isCurPage - 1);
    }
  }

  function handlePageChange(page: number) {
    if (page !== isCurPage) {
      setIsCurPage(page);
    }
  }

  const transactionsToRender = useMemo(
    () => getTransactionsForPage(isCurPage),
    [isCurPage, getTransactionsForPage],
  );

  function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.target.value;
    setSearchQuery(query);
  }

  return (
    <GridItems>
      <Filter
        cateState={cate}
        sortState={sorts}
        handleCateSort={handleOpenCateSort}
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        cateMenu={
          cate.isOpen && (
            <GridItems className="absolute right-0 top-full mt-2 !w-48 max-h-[60vh] overflow-y-auto shadow-pop animate-scale-in !p-1.5 z-50">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className="py-2.5 px-3 rounded-lg text-sm text-left hover:bg-beige-100 w-full"
                  onClick={() =>
                    handleCateOrSort("cate", typeof cat === "string" ? cat : "")
                  }
                >
                  {cat}
                </button>
              ))}
            </GridItems>
          )
        }
        sortMenu={
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
      <div className="grid grid-cols-[minmax(0,1.5fr),auto] md:grid-cols-[minmax(0,2fr),minmax(0,1.2fr),minmax(0,1.2fr),auto] gap-x-4 gap-y-6 md:gap-y-8 md:px-2 relative">
        <>
          <Title>Recipient / Sender</Title>
          <Title>Category</Title>
          <Title>Transaction Date</Title>
          <Title className="flex justify-end">Amount</Title>
          <div className="col-span-full h-px bg-beige-100 -my-4 hidden md:block" />
        </>

        {transactionsToRender.map((transaction, i) => (
          <TransactionsItem item={transaction} key={i} />
        ))}
      </div>
      {numPages > 1 && (
        <Pagination
          pages={pages}
          setIsCurPage={setIsCurPage}
          isCurPage={isCurPage}
          handleCurPage={handlePagination}
          onPageChange={handlePageChange}
        />
      )}
    </GridItems>
  );
}

export default Transaction;

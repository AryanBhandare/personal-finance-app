"use client";

import { ReactNode, useState } from "react";
import leftArr from "@/public/assets/images/icon-caret-left.svg";
import rightArr from "@/public/assets/images/icon-caret-right.svg";
import Image from "next/image";
// import { trxT } from "./Transaction";

type pagiProp = {
  pages: number[];
  isCurPage: number;
  handleCurPage: (type: string) => void;
  setIsCurPage: (curPaage: number) => void;
  onPageChange: (page: number) => void;
};

function Pagination({
  pages,
  handleCurPage,
  isCurPage,
  setIsCurPage,
  onPageChange,
}: pagiProp) {
  return (
    <div className="grid grid-cols-[40px,1fr,40px] md:grid-cols-[1fr,auto,1fr] gap-2 md:gap-4 items-center mt-8 pt-6 border-t border-beige-100">
      <div>
        {isCurPage === 1 ? null : (
          <PaginationItem onClick={() => handleCurPage("prev")}>
            <span className="h-4 w-4 relative">
              <Image src={leftArr} alt="Direction icon" fill />
            </span>
            <p className="hidden md:flex">Prev</p>
          </PaginationItem>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 md:gap-2 items-center justify-center">
        {pages.map((n, i) => (
          <PaginationItem
            key={i}
            isCurPage={isCurPage === n}
            onClick={() => onPageChange(n)}
          >
            <p>{n}</p>
          </PaginationItem>
        ))}
      </div>

      <div className="md:flex md:justify-end">
        {isCurPage === pages.length ? null : (
          <PaginationItem onClick={() => handleCurPage("next")}>
            <p className="hidden md:flex">Next</p>
            <span className="h-4 w-4 relative">
              <Image src={rightArr} alt="Direction icon" fill />
            </span>
          </PaginationItem>
        )}
      </div>
    </div>
  );
}

type PaginationProp = {
  children: ReactNode;
  onClick?: () => void;
  isCurPage?: boolean;
};

function PaginationItem({ children, onClick, isCurPage }: PaginationProp) {
  return (
    <button
      className={`rounded-lg flex items-center gap-3 border h-10 min-w-10 justify-center text-sm font-semibold tabular-nums ${
        isCurPage
          ? "bg-grey-900 border-grey-900 text-beige-100"
          : "bg-white border-beige-500/50 text-grey-900 hover:border-grey-900 hover:bg-beige-100"
      } px-3 transition-all duration-200`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Pagination;

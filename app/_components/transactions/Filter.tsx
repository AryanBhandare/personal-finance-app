import Image from "next/image";
import searchIcon from "@/public/assets/images/icon-search.svg";
import carretDown from "@/public/assets/images/icon-caret-down.svg";
import sortIcon from "@/public/assets/images/icon-sort-mobile.svg";
import filterIcon from "@/public/assets/images/icon-filter-mobile.svg";
import React from "react";

type FilterProps = {
  handleCateSort: (type: string) => void;
  sortState: { value: string; isOpen: boolean };
  cateState: { value: string; isOpen: boolean };
  searchQuery: string;
  handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  sortMenu?: React.ReactNode;
  cateMenu?: React.ReactNode;
};

function Filter({
  handleCateSort,
  sortState,
  cateState,
  searchQuery,
  handleSearch,
  sortMenu,
  cateMenu,
}: FilterProps) {
  return (
    <div className="flex items-center gap-2 md:gap-4 mb-6">
      <div className="flex-1 min-w-0 lg:max-w-[320px]">
        <SearchBar searchQuery={searchQuery} handleSearch={handleSearch} />
      </div>
      <div className="flex items-center gap-2 md:gap-4 md:ml-auto">
        <Sort
          sortState={sortState}
          handleCateSort={handleCateSort}
          menu={sortMenu}
        />
        <FilterCat
          cateState={cateState}
          handleCateSort={handleCateSort}
          menu={cateMenu}
        />
      </div>
    </div>
  );
}

const pickerButton =
  "flex md:grid md:grid-cols-[1fr,16px] items-center justify-center md:justify-between gap-2 h-11 w-11 md:h-auto md:w-auto md:min-w-[140px] md:px-3 md:py-3 rounded-xl text-sm md:border md:border-beige-500/60 md:hover:border-grey-900 hover:bg-beige-100 md:hover:bg-transparent transition-colors text-left";

type CateProp = {
  cateState: { value: string; isOpen: boolean };
  handleCateSort: (type: string) => void;
  menu?: React.ReactNode;
};

function FilterCat({ cateState, handleCateSort, menu }: CateProp) {
  return (
    <div className="relative flex items-center gap-2">
      <p className="text-sm text-grey-500 whitespace-nowrap hidden xl:flex">
        Category
      </p>
      <button
        className={pickerButton}
        onClick={() => handleCateSort("cate")}
        aria-label="Filter by category"
      >
        <p className="hidden md:block truncate">{cateState.value}</p>

        <span className="md:hidden flex relative h-5 w-5">
          <Image src={filterIcon} alt="" fill />
        </span>

        <span className="md:flex hidden relative h-4 w-4">
          <Image src={carretDown} alt="" fill />
        </span>
      </button>
      {menu}
    </div>
  );
}

type sortProp = {
  sortState: { value: string; isOpen: boolean };
  handleCateSort: (type: string) => void;
  menu?: React.ReactNode;
};

export function Sort({ sortState, handleCateSort, menu }: sortProp) {
  return (
    <div className="relative flex items-center gap-2">
      <p className="text-sm text-grey-500 whitespace-nowrap hidden xl:flex">
        Sort by
      </p>
      <button
        className={pickerButton}
        onClick={() => handleCateSort("sort")}
        aria-label="Sort transactions"
      >
        <p className="hidden md:block truncate">{sortState.value}</p>
        <span className="md:hidden flex relative h-5 w-5">
          <Image src={sortIcon} alt="" fill />
        </span>

        <span className="md:flex hidden relative h-4 w-4">
          <Image src={carretDown} alt="" fill />
        </span>
      </button>
      {menu}
    </div>
  );
}

type SearchProps = {
  searchQuery: string;
  handleSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function SearchBar({ searchQuery, handleSearch }: SearchProps) {
  return (
    <div className="w-full grid grid-cols-[1fr,32px] justify-between items-center gap-2 rounded-xl border border-beige-500/60 bg-white pr-2 transition-all duration-200 hover:border-grey-500 focus-within:border-grey-900 focus-within:ring-4 focus-within:ring-grey-900/5">
      <input
        type="text"
        placeholder="Search transaction"
        className="w-full px-4 py-3 text-sm outline-none bg-transparent rounded-xl"
        value={searchQuery}
        onChange={handleSearch}
      />

      <button className="h-4 w-4 relative">
        <Image src={searchIcon} alt="Search icon" fill />
      </button>
    </div>
  );
}

type titleType = {
  children: React.ReactNode;
  className?: string;
};

export function Title({ children, className }: titleType) {
  return (
    <h3
      className={`text-grey-500 text-xs uppercase tracking-wide md:flex hidden whitespace-nowrap ${className} `}
    >
      {children}
    </h3>
  );
}

export default Filter;

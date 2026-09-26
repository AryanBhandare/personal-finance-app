import { formatCurrency } from "@/app/_lib/dats-services";
import { getThemeHex } from "@/app/_lib/theme";
import saved from "@/public/assets/images/icon-pot.svg";

import Image from "next/image";
import Header from "../ui/Header";

type PotsItemsProps = {
  name: string;
  target: number;
  total: number;
  theme: string;
};

type potsProp = {
  potsItems: PotsItemsProps[];
};

function Pots({ potsItems }: potsProp) {
  const totalPots = potsItems
    ?.map((pot) => pot.total)
    .reduce((acc, cur) => acc + cur, 0);

  return (
    <div className="grid sm:grid-cols-[1fr,1.2fr] gap-5 mt-4">
      <div className="h-28 sm:h-32 w-full flex gap-4 sm:gap-5 items-center rounded-2xl bg-gradient-to-br from-secondary-green/10 to-secondary-green/[0.03] ring-1 ring-secondary-green/10 px-5">
        <div className="h-12 w-12 rounded-2xl bg-white shadow-card flex items-center justify-center shrink-0">
          <div className="relative h-7 w-6">
            <Image src={saved} alt="Pots" fill />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-secondary-green">
            Total Saved
          </h3>
          <h1 className="text-[26px] sm:text-[32px] leading-none tracking-tight text-grey-900 font-bold tabular-nums">
            {formatCurrency(totalPots)}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {potsItems?.slice(0, 4).map((pot, i) => (
          <ItemsColor {...pot} key={i} />
        ))}
      </div>
    </div>
  );
}

export type itemsColorType = {
  category?: string;
  target?: number;
  maximum?: number;
  theme: string;
  name?: string;
  total?: number;
  id?: string;
};

export function ItemsColor({
  category,
  theme,
  maximum,
  total,
  target,
  name,
}: itemsColorType) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-11 w-1 rounded-full shrink-0"
        style={{ backgroundColor: getThemeHex(theme ?? "") }}
      ></div>
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-xs text-grey-500 truncate">
          {category ? category : name}
        </p>
        <h2 className="text-sm font-bold tabular-nums text-grey-900">
          {maximum
            ? formatCurrency(maximum)
            : total
              ? formatCurrency(total)
              : null}
        </h2>
      </div>
    </div>
  );
}

export default Pots;

"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ItemsColor } from "./Pots";
import { TrxType } from "./Transactions";
import { formatCurrency } from "@/app/_lib/dats-services";
import { getThemeHex } from "@/app/_lib/theme";

export type budgetsProps = {
  category: string;
  maximum: number;
  theme: string;
  id: string;
};

export type BudgetsProp = {
  budgets: budgetsProps[];
  transactions?: TrxType[];
};

function Budgets({ budgets }: BudgetsProp) {
  // Calculate the total sum of maximum values
  const total = budgets.reduce((sum, budget) => sum + budget.maximum, 0);

  //  const totalSpend = budgets.reduce((sum, budget) => sum + budget.total, 0);

  return (
    <div className="grid sm:grid-cols-[1.4fr,1fr] xl:grid-cols-1 2xl:grid-cols-[1.4fr,1fr] gap-4 items-center">
      <div className="relative text-center">
        {/* Relative to position the inner content */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={budgets}
              dataKey="maximum"
              nameKey="category"
              innerRadius={84}
              outerRadius={118}
              paddingAngle={2}
              cornerRadius={4}
              stroke="none"
              animationDuration={800}
            >
              {budgets.map((entry, index) => (
                <Cell key={index} fill={getThemeHex(entry.theme)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Centered Total */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {total > 0 && (
            <>
              <p className="text-[28px] leading-none font-bold tracking-tight tabular-nums">
                {formatCurrency(total)}
              </p>
              <p className="text-xs text-grey-500 mt-2">total limit</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-1 gap-4 content-center pb-4">
        {budgets?.map((budget, i) => (
          <ItemsColor {...budget} key={i} />
        ))}
      </div>
    </div>
  );
}

export default Budgets;

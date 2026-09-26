"use client";
import { LuPieChart } from "react-icons/lu";

import { calculatePercentage, formatCurrency } from "@/app/_lib/dats-services";
// import { budgetsItems, BudgetsProp, budgetsProps } from "../overview/Budgets";
import GridItems, {
  FlexItems,
  HeaderGrid,
  LinkButton,
} from "../overview/GridItems";
import { ItemsColor } from "../overview/Pots";
import Image from "next/image";
import menu from "@/public/assets/images/icon-ellipsis.svg";
import Transactions, { TrxType } from "../overview/Transactions";
import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import PotsForm, { FormEdit } from "../pots/PotsForm";
import DeleteModal from "../ui/DeleteModal";
import BudgtForm from "./BudgtForm";
import { deleteBudget, getTransaction } from "@/app/_lib/actions";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { getThemeHex } from "@/app/_lib/theme";

export type itemsColorType = {
  name?: string;
  target?: number;
  total?: number;
  theme: string;
  category?: string;
  transactions?: TrxType[];
  maximum: number;
  budgetId?: string | undefined;
};

function BudgetsItems({ transactions }: transac) {
  return (
    <>
      {transactions.map((budget, i) => (
        <BudgetsItem key={i} item={budget} />
      ))}
    </>
  );
}

function BudgetsItem({ item }: Item) {
  const { theme, name, maximum, category, transactions, budgetId } = item;

  const [openMenu, setOpenMen] = useState({
    menu: false,
    modal: { open: false, toOpen: "" },
  });

  const [isDeleting, setIsDeleting] = useState(false);

  function handleOpenMenu() {
    setOpenMen((prevState) => ({
      ...prevState,
      menu: !prevState.menu,
    }));
  }

  function handleOpenModal(type: string) {
    if (type === "edit") {
      setOpenMen((prevState) => ({
        ...prevState,
        modal: { open: true, toOpen: "edit" },
      }));
    } else if (type === "delete")
      setOpenMen((prevState) => ({
        ...prevState,
        modal: { open: true, toOpen: "delete" },
      }));
  }

  function handleCloseModal() {
    setOpenMen((prevState) => ({
      ...prevState,
      modal: { open: false, toOpen: "" },
    }));
  }

  async function handleDelBudget() {
    setIsDeleting(true);
    try {
      const res = await deleteBudget(budgetId);
      if (!res.ok) alert(res.error);
    } catch (error) {
      console.error("Error deleting budget:", error);
    } finally {
      setIsDeleting(false);
      handleCloseModal();
    }
  }

  const total = transactions
    ?.map((tr) => tr.amount)
    .reduce((acc, cur) => acc + cur, 0);

  const tottl = typeof total !== "undefined" ? total : 0;

  const rem = +maximum + tottl;

  return (
    <GridItems className="relative hover:shadow-card-hover">
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-2xl"
        style={{ backgroundColor: getThemeHex(theme) }}
      />
      {openMenu.modal.toOpen == "edit" && (
        <Modal
          isOpen={openMenu.modal.open}
          onClose={handleCloseModal}
          title={`Edit ${item.category} budget`}
        >
          <BudgtForm
            type="edit"
            message=""
            edit={item}
            close={handleCloseModal}
          />
        </Modal>
      )}

      {openMenu.modal.toOpen == "delete" && (
        <Modal
          isOpen={openMenu.modal.open}
          onClose={handleCloseModal}
          title={`Delete '${item.category} budget' `}
        >
          <DeleteModal
            item="budget"
            deleteFn={handleDelBudget}
            close={handleCloseModal}
            loading={isDeleting}
          />
        </Modal>
      )}
      <FlexItems className="relative">
        <div className="flex items-center gap-3">
          <span
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${getThemeHex(theme)}1f`,
              color: getThemeHex(theme),
            }}
          >
            <LuPieChart size={20} />
          </span>
          <h1 className="text-xl font-bold tracking-tight">{category}</h1>
        </div>

        <button
          className="w-8 h-8 -mr-2 rounded-full flex items-center justify-center relative hover:bg-beige-100"
          onClick={handleOpenMenu}
          aria-label="Budget options"
        >
          <span className="w-4 h-1 relative">
            <Image src={menu} alt="Menu" fill />
          </span>
        </button>

        {openMenu.menu ? (
          <FormEdit handleEdit={handleOpenModal} type="budgets" className="" />
        ) : null}
      </FlexItems>

      <p className="my-5 text-sm text-grey-500">
        Maximum {formatCurrency(maximum)}
      </p>

      <div className="w-full h-8 rounded-lg z-20 bg-beige-100 flex items-center p-1">
        <div
          style={{
            width: `${calculatePercentage(
              tottl < 0 ? tottl * -1 : tottl,
              maximum,
            ).toFixed(2)}%`,
            backgroundColor: getThemeHex(theme ?? ""),
          }}
          className="h-full max-w-full rounded-md z-30 transition-[width] duration-700 ease-out"
        ></div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-5">
        <div className="flex items-center gap-4">
          <div
            className="h-11 w-1 rounded-full"
            style={{ backgroundColor: getThemeHex(theme ?? "") }}
          ></div>

          <div className="flex flex-col gap-1">
            <p className="text-grey-500 text-xs">Spent</p>
            <p className="text-sm font-bold tabular-nums">
              {formatCurrency(typeof total !== "undefined" ? total : 0).replace(
                "-",
                "",
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-11 w-1 rounded-full bg-beige-100"></div>
          <div className="flex flex-col gap-1">
            <p className="text-grey-500 text-xs">Remaining</p>
            <p className="text-sm font-bold tabular-nums">
              {formatCurrency(+rem)}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full rounded-xl flex flex-col bg-beige-100 px-5 pt-3 pb-1">
        <FlexItems>
          <HeaderGrid>Latest spending</HeaderGrid>

          <LinkButton href="/transactions">See All</LinkButton>
        </FlexItems>

        {/* change when real data comes */}
        <Transactions transactions={transactions?.slice(0, 3) || []} />
      </div>
    </GridItems>
  );
}

type bugsumprop = {
  category: string;
  transactions?: TrxType[];
  theme: string;
  maximum: number;
  id: string;
};

type transac = {
  transactions: bugsumprop[];
  userId?: string | undefined;
};

export function BudgetsSummaryItems({ transactions }: transac) {
  const [budgets, setBudgets] = useState<bugsumprop[]>([]);

  useEffect(() => {
    async function getbudgets() {
      const bud = await getTransaction();

      setBudgets(bud?.budgets);
    }

    getbudgets();
  }, []);

  const total = budgets.reduce((sum, budget) => sum + budget.maximum, 0);

  return (
    <GridItems>
      <div className="grid gap-4 md:grid-cols-2 md:items-center xl:grid-cols-1">
        <div className="relative text-center">
          {" "}
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
        <h1 className="text-grey-900 text-xl font-bold tracking-tight">
          Spending Summary
        </h1>
        <div className="flex flex-col divide-y divide-beige-100">
          {transactions.map((budget, i) => (
            <BudgetsColors item={budget} key={i} />
          ))}
        </div>
      </div>
    </GridItems>
  );
}

export type Item = {
  item: itemsColorType;
  transactions?: itemsColorType[];
  userId?: string | undefined;
};

function BudgetsColors({ item }: Item) {
  const { theme, name, maximum, category, transactions, budgetId } = item;

  const total = transactions
    ?.map((tr) => tr.amount)
    .reduce((acc, cur) => acc + cur, 0);

  return (
    <div className="grid grid-cols-[16px,1fr] items-center gap-2 w-full py-3">
      <div
        className="h-6 w-1 rounded-full"
        style={{ backgroundColor: getThemeHex(theme ?? "") }}
      ></div>
      <div className="flex justify-between items-center gap-4">
        <p className="text-sm text-grey-500">{category}</p>
        <div className="flex items-center gap-2">
          <h2 className="font-bold tabular-nums">
            {formatCurrency(typeof total !== "undefined" ? total : 0).replace(
              "-",
              "",
            )}
          </h2>
          <p className="text-grey-500 font-light text-sm">
            of {formatCurrency(maximum)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default BudgetsItems;

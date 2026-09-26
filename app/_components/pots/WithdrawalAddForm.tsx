"use client";

import { calculatePercentage, formatCurrency } from "@/app/_lib/dats-services";
import { FlexItems } from "../overview/GridItems";
import { potsProp } from "./Pots";
import React, { useEffect, useState } from "react";
import { Input } from "../budgets/BudgtForm";
import { useForm } from "react-hook-form";
import Button from "../ui/Button";
import {
  addMoneyToPot,
  getTransaction,
  getTransactions,
  withdrawFromPot,
} from "@/app/_lib/actions";
import SpinnerMini from "../ui/SpinnerMini";

type formparam = {
  type: "add" | "withdraw";
  item: potsProp;
  close: () =>void
};

type FormValues = {
  amount: number;
};

function WithdrawalAddForm({ type, item, close }: formparam) {
  const { register, handleSubmit, formState, setValue, watch } =
    useForm<FormValues>();
  const { errors } = formState;

  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const amount = watch("amount", 0); // Watch the amount from the form

  // Calculate the remaining amount for add
  const maxValue = Math.max(0, item.target - item.total);

  useEffect(() => {
    async function getSetBalance() {
      const data = await getTransaction();

      const curBalance = data.balance;

      setBalance(curBalance?.current);
    }
    getSetBalance();
  }, []);

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      if (type === "add") await addMoneyToPot(item.id, Number(data.amount));
      else await withdrawFromPot(item.id, Number(data.amount));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      close(); // Close the form if successful
    }
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-grey-500 mb-6">
        {type === "add"
          ? "Add money to your pot to keep it separate from your main balance. As soon as you add this money, it will be deducted from your current balance."
          : "Withdraw from your pot to put money back in your main balance. This will reduce the amount you have in this pot."}
      </p>

      <FlexItems>
        <p className="text-grey-500 text-sm">Total Saved</p>
        <h1 className="text-[32px] leading-none font-bold tracking-tight tabular-nums">
          {formatCurrency(item.total)}
        </h1>
      </FlexItems>

      <div
        className="w-full h-2 rounded-full z-20 bg-beige-100 grid gap-0.5 mt-4 mb-2 overflow-hidden"
        style={{
          gridTemplateColumns: `${calculatePercentage(
            item.total,
            item.target
          ).toFixed(2)}% 1fr`,
        }}
      >
        {/* Progress for the total saved */}
        <div
          style={{
            width: "100%", // Use 100% as it's controlled by the grid column
          }}
          className="bg-grey-900 h-2 rounded-full z-30"
        ></div>

        {/* Progress for the amount to add/withdraw */}
        <div
          style={{
            width: `${calculatePercentage(Number(amount), item.target).toFixed(
              2
            )}%`,
            maxWidth: `${calculatePercentage(maxValue, item.target).toFixed(
              2
            )}%`, // Set max width based on remaining target
          }}
          className={`${
            type === "add" ? "bg-secondary-green" : "bg-secondary-red"
          } rounded-full z-50`}
        ></div>
      </div>

      <FlexItems className="mb-6">
        <p
          className={`${
            type === "add" ? "text-secondary-green" : "text-secondary-red"
          } text-sm font-semibold`}
        >
          {`${calculatePercentage(item.total, item.target).toFixed(2)}%`}
        </p>
        <p className="text-grey-500 text-sm">
          Target of {formatCurrency(item.target)}
        </p>
      </FlexItems>

      <div className="w-full flex flex-col gap-6">
        <Input label={`Amount to ${type}`}>
          <input
            placeholder="$"
            className="h-full w-full outline-none"
            type="number"
            {...register("amount", {
              required: `Specify amount to ${type}`,
              max: {
                value: type === "add" ? maxValue : item.total, // Limit the value based on remaining target
                message: `Amount cannot exceed ${
                  type === "add"
                    ? `${formatCurrency(maxValue)} `
                    : `${formatCurrency(item.total)}`
                }`,
              },
              validate: (value) => balance > value || `Insufficient balance`,
            })}
          />
          {errors?.amount?.message ? (
            <span className="text-secondary-red text-sm flex items-center justify-end my-1">
              {errors?.amount?.message}
            </span>
          ) : null}
        </Input>
        <Button
          className="flex items-center justify-center"
          onClick={handleSubmit(onSubmit)}
        >
          {loading ? (
            <SpinnerMini />
          ) : (
            `Confirm ${type === "add" ? "Addition" : "Withdraw"}`
          )}
        </Button>
      </div>
    </div>
  );
}

export default WithdrawalAddForm;

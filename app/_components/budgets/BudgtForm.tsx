"use client";

import { ReactNode, useEffect, useState } from "react";
import { getThemeHex } from "@/app/_lib/theme";
import GridItems from "../overview/GridItems";
import carDown from "@/public/assets/images/icon-caret-down.svg";
import Image from "next/image";
import Button from "../ui/Button";
import { useForm } from "react-hook-form";
import SpinnerMini from "../ui/SpinnerMini";
import {
  ActionResult,
  createBudget,
  editBudget,
  getTransaction,
} from "@/app/_lib/actions";
import Budgets, { budgetsProps as budp } from "../overview/Budgets";
import { Item, itemsColorType } from "./BudgetsItem";
import { potsProp } from "../pots/Pots";
import { generateUniqueId } from "@/app/_lib/dats-services";

export { carDown };
export type budgetsProps = {
  type: "new" | "edit";
  message: string;
  edit?: itemsColorType;
  editPots?: potsProp;
  close?: () => void;
  userId?: string | undefined;
};

type FormValues = {
  maximum: number;
};

function BudgtForm({ type, message, edit, close }: budgetsProps) {
  const { register, handleSubmit, formState, setValue } = useForm<FormValues>();

  const { errors } = formState;

  const initialState = {
    color: "",
    category: "",
  };
  const [colorOpen, setColorOpen] = useState({
    open: false,
    color: { theme: type === "edit" ? edit?.theme : initialState.color },
  });

  const [catOpen, setCatOpen] = useState({
    open: false,
    cat: { category: initialState.category },
  });

  const [existCat, setXistCat] = useState([]);
  // const [budgett, setBudgett] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  function handleOpenColor() {
    setColorOpen((prevState) => ({
      ...prevState,
      open: !prevState.open,
    }));
  }

  async function onSubmit(data: FormValues) {
    const formValue = {
      maximum: +data.maximum,
      theme: colorOpen.color.theme,
      category: catOpen.cat.category,
      id: generateUniqueId(8),
    };

    setLoading(true);
    setFormError("");
    let res: ActionResult;
    try {
      if (type === "edit") {
        const datay = {
          maximum: +data.maximum,
          theme: edit?.theme,
          category: edit?.category,
          budgetId: edit?.budgetId,
        };

        res = await editBudget(edit?.budgetId, datay);
      } else {
        res = await createBudget(formValue);
      }
      if (!res.ok) return setFormError(res.error);
      close?.();
    } catch (error) {
      console.error("Budget save failed", error);
      setFormError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSetTheme(theme: { theme: string }) {
    setColorOpen((prevState) => ({
      ...prevState,
      open: false,
      color: theme,
    }));
  }

  function handleOpenCat() {
    setCatOpen((prevState) => ({
      ...prevState,
      open: !prevState.open,
    }));
  }

  function handleSetCat(category: { category: string }) {
    setCatOpen((prevState) => ({
      ...prevState,
      open: false,
      cat: category,
    }));
  }

  useEffect(() => {
    async function getTrx() {
      try {
        const { budgets } = await getTransaction();

        const cats = budgets.map((bud: budp) => bud.category);
        setXistCat(cats);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        // throw new Error("Error fetching transactions");
      }
    }

    getTrx();
  }, []);

  return (
    <div className="w-full h-full">
      <p className="text-sm leading-relaxed text-grey-500 mb-6">
        {type === "new"
          ? "Choose a category to set a spending budget. These categories can help you monitor spending"
          : "As your budgets change, feel free to update your spending limits."}
      </p>

      <div className="w-full flex flex-col gap-6">
        <Input label="Budget Category">
          {catOpen.open && (
            <Categories
              open={catOpen.open}
              setOpen={handleOpenCat}
              handleSetCats={handleSetCat}
              categories={existCat}
              item={edit}
            />
          )}
          <button
            className={`w-full flex justify-between items-center h-full ${
              type === "edit" ? "cursor-not-allowed" : ""
            }`}
            onClick={handleOpenCat}
            disabled={type === "edit"}
          >
            <span className="">
              {type === "edit" ? edit?.category : catOpen.cat.category}
            </span>

            <span className="relative h-4 w-4">
              <Image src={carDown} alt="Arrow img" fill />
            </span>
          </button>
        </Input>

        <Input label="Max Spend">
          <input
            placeholder="$ e.g 2000"
            className="h-full w-full outline-none"
            type="number"
            id="maximum"
            {...register("maximum", {
              required: "Please enter your maximum for this budget",
              pattern: {
                value: /^[0-9]+$/,
                message: "Please enter a valid number",
              },
              min: { value: 10, message: "Minimum amount is $10" },
            })}
            defaultValue={type === "edit" ? edit?.maximum : ""}
          />
          {errors?.maximum?.message ? (
            <span className="text-secondary-red text-sm flex items-center justify-end my-2">
              {errors?.maximum?.message}
            </span>
          ) : null}
        </Input>

        <Input label="Theme">
          {colorOpen.open && (
            <ColorMenu
              open={colorOpen.open}
              setOpen={handleOpenColor}
              handleSetThemes={handleSetTheme}
              type={type}
            />
          )}
          <button
            className={`w-full flex justify-between items-center  h-full ${
              type === "edit" ? "cursor-not-allowed" : ""
            }`}
            onClick={handleOpenColor}
            disabled={type === "edit"}
          >
            <span className="flex items-center gap-4">
              <div
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor: getThemeHex(colorOpen.color.theme ?? ""),
                }}
              ></div>
              <p className="capitalize">
                {type === "edit" ? edit?.theme : colorOpen.color.theme}
              </p>
            </span>

            <span className="relative h-4 w-4">
              <Image src={carDown} alt="Arrow img" fill />
            </span>
          </button>
        </Input>

        {formError ? (
          <p className="rounded-xl bg-secondary-red/10 px-4 py-3 text-sm text-secondary-red">
            {formError}
          </p>
        ) : null}

        <Button
          className="flex items-center justify-center"
          onClick={handleSubmit(onSubmit)}
        >
          {loading ? (
            <SpinnerMini />
          ) : type === "new" ? (
            "Add Budget"
          ) : (
            "Edit Budget"
          )}
        </Button>
      </div>
    </div>
  );
}

type InputProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function Input({ label, children, className }: InputProps) {
  return (
    <div className={`${className} relative`}>
      <label
        htmlFor={label}
        className="block text-xs font-bold uppercase tracking-wide text-grey-500 mb-2"
      >
        {label}
      </label>

      {/* The border is drawn on a 48px pseudo-element so hints and errors
          rendered as children flow below the field instead of overflowing it. */}
      <div className="relative w-full px-4 [&>input]:h-12 [&>button]:h-12 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-12 before:rounded-xl before:border before:border-beige-500/60 before:transition-all before:duration-200 hover:before:border-grey-500 focus-within:before:border-grey-900 focus-within:before:ring-4 focus-within:before:ring-grey-900/5">
        {children}
      </div>
    </div>
  );
}

type menuProp = {
  open: boolean;
  setOpen: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleSetThemes?: (theme: { theme: string }) => void;
  handleSetCats?: (category: { category: string }) => void;
  type?: "edit" | "new";
  categories?: string[];
  item?: itemsColorType;
};
export function ColorMenu({
  open,
  setOpen,
  handleSetThemes,
  type,
  item,
}: menuProp) {
  const colorPallete = [
    { theme: "green" },
    { theme: "yellow" },
    { theme: "cyan" },
    { theme: "navy" },
    { theme: "red" },
    { theme: "purple" },
    { theme: "lightPurple" },
    { theme: "turquoise" },
    { theme: "brown" },
    { theme: "magenta" },
    { theme: "navyGrey" },
    { theme: "amyGreen" },
    { theme: "gold" },
    { theme: "orange" },
  ];

  function handleTheme(theme: { theme: string }) {
    handleSetThemes?.(theme);
  }

  return (
    <GridItems className="!w-auto !p-2 z-50 absolute top-full mt-2 left-0 right-0 max-h-[260px] overflow-y-auto shadow-pop animate-scale-in">
      {colorPallete.map((color, i) => (
        <button
          className="w-full py-3 px-3 rounded-lg hover:bg-beige-100 transition-colors"
          key={i}
          onClick={() => handleTheme(color)}
        >
          <span className="flex items-center gap-4">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: getThemeHex(color.theme ?? "") }}
            ></div>
            <p className="text-grey-500 capitalize">{color.theme}</p>
          </span>
        </button>
      ))}
    </GridItems>
  );
}

export function Categories({
  open,
  setOpen,
  handleSetCats,
  categories,
}: menuProp) {
  const categorie = [
    { category: "Entertainment" },
    { category: "Bills" },
    { category: "Groceries" },
    { category: "Dining Out" },
    { category: "Transportation" },
    { category: "Personal Care" },
    { category: "Education" },
    { category: "Lifestyle" },
    { category: "Shopping" },
    { category: "General" },
  ];

  function handleTheme(category: { category: string }) {
    handleSetCats?.(category);
  }

  return (
    <GridItems className="!w-auto !p-2 z-50 absolute top-full mt-2 left-0 right-0 max-h-[260px] overflow-y-auto shadow-pop animate-scale-in">
      {categorie.map((color, i) => (
        <button
          className={`w-full py-3 px-2 rounded-lg text-start flex justify-between items-center transition-colors ${
            categories?.includes(color.category)
              ? "cursor-not-allowed text-grey-300"
              : "cursor-pointer hover:bg-beige-100"
          }`}
          key={i}
          onClick={() => handleTheme(color)}
          disabled={categories?.includes(color.category)}
        >
          <span>{color.category}</span>

          {categories?.includes(color.category) && (
            <p className="text-grey-500 text-sm">Already used</p>
          )}
        </button>
      ))}
    </GridItems>
  );
}

export default BudgtForm;

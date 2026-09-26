"use client";

import { useState } from "react";
import { getThemeHex } from "@/app/_lib/theme";
import GridItems from "../overview/GridItems";
import { budgetsProps, carDown, ColorMenu, Input } from "../budgets/BudgtForm";
import Image from "next/image";
import Button from "../ui/Button";
import { useForm } from "react-hook-form";
import { ActionResult, createPots, editPot } from "@/app/_lib/actions";
import SpinnerMini from "../ui/SpinnerMini";
import { generateUniqueId } from "@/app/_lib/dats-services";

type FormValues = {
  name: string;
  // theme: string;
  target: number;
};

function PotsForm({ type, message, editPots, close }: budgetsProps) {
  const { register, handleSubmit, formState, setValue } = useForm<FormValues>();
  const { errors } = formState;

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxChar = 30;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharCount(e.target.value.length);
  };

  const [colorOpen, setColorOpen] = useState({
    open: false,
    color: { theme: type === "edit" ? editPots?.theme : "green" },
  });

  function handleOpenColor() {
    setColorOpen((prevState) => ({
      ...prevState,
      open: !prevState.open,
    }));
  }

  function handleSetTheme(theme: { theme: string }) {
    setColorOpen((prevState) => ({
      ...prevState,
      open: false,
      color: theme,
    }));
  }

  async function onSubmit(data: FormValues) {
    const dataPots = {
      name: data.name,
      theme: colorOpen.color.theme,
      target: +data.target,
      id: generateUniqueId(9),
      total: 0,
    };

    setIsLoading(true);
    setFormError("");
    let res: ActionResult;

    try {
      if (type === "edit") {
        const editData = {
          ...data,
          theme: colorOpen.color.theme,
          id: editPots?.id,
        };
        res = await editPot(editPots?.id, editData);
      } else res = await createPots(dataPots);
      if (!res.ok) return setFormError(res.error);
      close?.();
    } catch (error) {
      console.error(error);
      setFormError("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full h-full">
      <p className="text-sm leading-relaxed text-grey-500 mb-6">
        {type === "new"
          ? "Create a POT and start saving for rainy days"
          : "As your income increase adjust your savings as well."}
      </p>

      <div className="w-full flex flex-col gap-6">
        <Input label="Pot Name">
          <input
            placeholder="$ e.g Rainy Days"
            className="h-full w-full outline-none"
            type="text"
            defaultValue={editPots?.name}
            {...register("name", {
              required: "Pot name is required",
              maxLength: {
                value: maxChar,
                message: `Pot name cannot exceed ${maxChar} characters`,
              },
            })}
            onChange={handleInputChange}
          />

          {errors?.name?.message ? (
            <span className="text-secondary-red text-sm flex items-center justify-end my-2">
              {errors?.name?.message}
            </span>
          ) : (
            <span className="text-end w-full flex justify-end mt-2 text-xs text-grey-500">
              {charCount < 30 ? maxChar - charCount : 0} characters left
            </span>
          )}
        </Input>

        <Input label="Target">
          <input
            placeholder="$ e.g 2000"
            className="h-full w-full outline-none"
            type="number"
            defaultValue={editPots?.target}
            {...register("target", {
              required: "You should have a target for your pot",
              pattern: {
                value: /^[0-9]+$/,
                message: "Please enter a valid amount",
              },
              min: { value: 10, message: "Minimum amount is $10" },
            })}
          />

          {errors?.target?.message ? (
            <span className="text-secondary-red text-sm flex items-center justify-end my-2">
              {errors?.target?.message}
            </span>
          ) : null}
        </Input>

        <Input label="Theme">
          {colorOpen.open && (
            <ColorMenu
              open={colorOpen.open}
              setOpen={handleOpenColor}
              handleSetThemes={handleSetTheme}
            />
          )}
          <button
            className="w-full flex justify-between items-center  h-full"
            onClick={handleOpenColor}
          >
            <span className="flex items-center gap-4">
              <div
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor: getThemeHex(colorOpen.color.theme ?? ""),
                }}
              ></div>
              <p className="capitalize">{colorOpen.color.theme}</p>
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
          {isLoading ? (
            <SpinnerMini />
          ) : type === "new" ? (
            "Add Pot"
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}

type editProps = {
  handleEdit: (type: string) => void;
  type: string;
  className?: string;
};

export function FormEdit({ handleEdit, type, className }: editProps) {
  return (
    <GridItems
      className={`absolute right-0 top-8 !w-auto min-w-[150px] !p-1.5 shadow-pop animate-scale-in z-[100] ${className}`}
    >
      <button
        className="text-grey-900 py-2.5 px-3 rounded-lg text-sm w-full text-left capitalize hover:bg-beige-100"
        onClick={() => handleEdit("edit")}
      >
        Edit {type}
      </button>
      <button
        className="text-secondary-red py-2.5 px-3 rounded-lg text-sm w-full text-left capitalize hover:bg-secondary-red/10"
        onClick={() => handleEdit("delete")}
      >
        Delete {type}
      </button>
    </GridItems>
  );
}

export default PotsForm;

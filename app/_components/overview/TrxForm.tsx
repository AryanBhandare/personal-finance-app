import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Categories, Input } from "../budgets/BudgtForm"; // Assuming you already have this component
import {
  createTrx,
  getReceiver,
  getTransaction,
  getUser,
} from "@/app/_lib/actions";
import Button from "../ui/Button";
import Image from "next/image";
import { generateUniqueId } from "@/app/_lib/dats-services";
import SpinnerMini from "../ui/SpinnerMini";

type FormValues = {
  amount: number;
  accountId: string;
};

type trxForm = {
  close: () => void;
};

function TrxForm({ close }: trxForm) {
  const { register, handleSubmit, formState, setValue, watch } =
    useForm<FormValues>();
  const { errors } = formState;
  const accountId = watch("accountId"); // Watch the input for account ID changes

  const initialState = {
    color: "",
    category: "General",
  };

  const [catOpen, setCatOpen] = useState({
    open: false,
    cat: { category: initialState.category },
  });

  const [existCat, setXistCat] = useState([]);
  // const [budgett, setBudgett] = useState([]);

  const [receiverDetails, setReceiverDetails] = useState<any>(null); // Receiver details state
  const [loading, setLoading] = useState({ name: "", status: false });
  const [balance, setBalance] = useState(0);

  function handleOpenCat(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
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

  // Debounce account ID API request
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (accountId) {
        fetchReceiverDetails(accountId);
      }
    }, 1000); // Wait for 1 second after typing

    // Clean up the debounce timeout if the input changes
    return () => clearTimeout(delayDebounceFn);
  }, [accountId]);

  // const maxValue = Math.max(0, item.target - item.total);

  useEffect(() => {
    async function getSetBalance() {
      const data = await getTransaction();

      const curBalance = data.balance;

      setBalance(curBalance?.current);
    }
    getSetBalance();
  }, []);

  const fetchReceiverDetails = async (accountId: string) => {
    setLoading({ name: "name", status: true });
    try {
      const response = await getReceiver(accountId);
      setReceiverDetails(response);
    } catch (error) {
      console.error("Error fetching receiver details:", error);
      setReceiverDetails(null);
    }
    setLoading({ name: "name", status: false });
  };

  async function onSubmit(data: FormValues) {
    setLoading({ name: "trx", status: true });
    const trx = {
      id: generateUniqueId(10),
      date: new Date().toISOString(),
      name: receiverDetails?.name,
      amount: Number(data.amount),
      avatar: receiverDetails?.avatar,
      category: catOpen.cat.category,
      recurring: false,
    };

    try {
      const curUser = await getUser();

      if (receiverDetails.user_id === curUser.user_id) {
        alert("You can't send money to yourself.");
        close();
        return;
      }
      await createTrx(receiverDetails.user_id, trx);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading({ name: "", status: false });
      close();
    }
  }

  return (
    <form className="flex flex-col gap-6">
      <Input label="Account ID">
        <input
          placeholder="Account ID"
          className="h-full w-full outline-none"
          type="text"
          {...register("accountId", {
            required: "Please enter receiver's account ID",
            validate: async (value) => {
              const receiver = await getReceiver(value);

              return receiver?.name ? true : "User not found";
            },
          })}
        />
        {errors?.accountId?.message ? (
          <span className="text-secondary-red text-sm flex items-center justify-end my-2">
            {errors?.accountId?.message}
          </span>
        ) : null}

        {loading.name === "name" && loading.status === true ? (
          <p className="text-sm text-grey-500 text-end">searching user</p>
        ) : null}
        {receiverDetails && (
          <div>
            <p className="text-end text-grey-500 mt-2">
              {receiverDetails.name}
            </p>
          </div>
        )}
      </Input>

      <Input label="Amount">
        <input
          placeholder="$ e.g 2000"
          className="h-full w-full outline-none"
          type="number"
          {...register("amount", {
            required: "Please enter an amount to send",
            pattern: {
              value: /^[0-9]+$/,
              message: "Please enter a valid number",
            },
            min: { value: 1, message: "Minimum amount is $1" },
            validate: (value) => balance >= value || "insufficient balance",
          })}
        />
        {errors?.amount?.message ? (
          <span className="text-secondary-red text-sm flex items-center justify-end my-2">
            {errors?.amount?.message}
          </span>
        ) : null}
      </Input>

      <Input label="Category">
        {catOpen.open && (
          <Categories
            open={catOpen.open}
            setOpen={handleOpenCat}
            handleSetCats={handleSetCat}
            categories={existCat}
          />
        )}
        <button
          className={`w-full flex justify-between items-center h-full`}
          onClick={handleOpenCat}
        >
          <span className="">{catOpen.cat.category}</span>

          <span className="relative h-4 w-4">
            {/* <Image src={carDown} alt="Arrow img" fill /> */}
          </span>
        </button>
      </Input>

      <Button
        className="flex items-center justify-center"
        onClick={handleSubmit(onSubmit)}
      >
        {loading.name === "trx" && loading.status === true
          ? `sending... `
          : "transfer money"}
      </Button>
    </form>
  );
}

export default TrxForm;

import { formatCurrency } from "@/app/_lib/dats-services";

type transactionsProp = {
  recurringTrans: TrxType[];
};
type TrxType = {
  avatar: string;
  name: string;
  category?: string;
  date: string;
  amount: number;
  recurring?: boolean;
  status?: string;
};

function Recurring({ recurringTrans }: transactionsProp) {
  // Helper function to calculate the next payment date
  const calculateNextPaymentDate = (date: Date): Date => {
    const nextPaymentDate = new Date(date);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); // Recurs every month
    return nextPaymentDate;
  };

  // Current date and one week later
  const currentDate = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(currentDate.getDate() + 7);

  // Initialize the result array
  let trxx: TrxType[] = [];
  const statusesSet = new Set<string>();

  // Iterate through the recurring transactions and categorize them
  recurringTrans?.forEach((trx) => {
    const trxDate = new Date(trx.date);
    const nextPaymentDate = calculateNextPaymentDate(trxDate);

    let status: string;

    if (nextPaymentDate < currentDate) {
      status = "Paid";
    } else if (
      nextPaymentDate >= currentDate &&
      nextPaymentDate <= oneWeekLater
    ) {
      status = "Due soon";
    } else {
      status = "Upcoming";
    }

    // Add the transaction with status to the result array
    if (!statusesSet.has(status)) {
      statusesSet.add(status);
      trxx.push({ ...trx, status });
    }
  });

  return (
    <div className="flex flex-col justify-center items-center gap-3 mt-6 pb-2">
      {trxx.map((payment, index) => (
        <RecurringId key={index} {...payment} />
      ))}
    </div>
  );
}

type Payment = {
  amount: number;
  status: string;
  name: string;
};
export function RecurringId({ amount, status }: TrxType) {
  // if()
  return (
    <div
      className={`w-full h-[60px] rounded-xl border-l-4 px-4 flex items-center justify-between transition-transform duration-200 hover:translate-x-0.5 ${
        status === "Paid"
          ? "border-l-secondary-green"
          : status === "Upcoming"
            ? "border-l-secondary-yellow"
            : status === "Due soon"
              ? "border-l-secondary-cyan  "
              : ""
      } bg-beige-100`}
    >
      <p className="capitalize text-sm text-grey-500">{status}</p>
      <p className="text-sm font-bold tabular-nums">
        {formatCurrency(amount).replace("-", "")}
      </p>
    </div>
  );
}

export default Recurring;

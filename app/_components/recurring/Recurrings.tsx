import BalanceItem from "../overview/BalanceItem";
import recurringIcon from "@/public/assets/images/icon-recurring-bills.svg";
import RecurringItems, { Item, RecurringSummary } from "./RecurringItems";
import { getTransaction, getTransactions } from "@/app/_lib/actions";
import { TrxType } from "../overview/Transactions";
import Empty from "../ui/Empty";

async function Recurrings() {
  const { transactions } = await getTransaction();

  const filteredTransactions = transactions.filter(
    (trx: TrxType) => trx.recurring === true
  );

  const calculateNextPaymentDate = (date: Date): Date => {
    const nextPaymentDate = new Date(date);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); // Recurs every month
    return nextPaymentDate;
  };

  // Current date and one week later
  const currentDate = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(currentDate.getDate() + 7);

  let trxx: Item[] = [];
  let uniqueTrxx: Item[] = [];

  const statusesSet = new Set<string>();

  filteredTransactions.forEach((trx: Item) => {
    const trxDate = new Date(trx.date);
    const nextPaymentDate = calculateNextPaymentDate(trxDate);

    let status: string;

    if (nextPaymentDate < currentDate) {
      status = "Paid";
      trxx.push({ ...trx, status });
    } else if (
      nextPaymentDate >= currentDate &&
      nextPaymentDate <= oneWeekLater
    ) {
      status = "Due soon";
      trxx.push({ ...trx, status });
    } else {
      status = "Upcoming";
      trxx.push({ ...trx, status });
    }

    if (!statusesSet.has(status)) {
      statusesSet.add(status);
      uniqueTrxx.push({ ...trx, status });
    }
  });

  const total = trxx
    .map((trx) => trx.amount)
    .reduce((acc, val) => acc + val, 0);

  if (!transactions.length)
    return (
      <div className="w-full h-screen">
        <Empty name="Recurring Bills" />
      </div>
    );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,2.2fr] items-start">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
        <BalanceItem
          balance={total}
          title="Total Bills"
          image={recurringIcon}
        />

        <RecurringSummary transactions={trxx} />
      </div>
      <div>
        <RecurringItems transactions={trxx} />
      </div>
    </div>
  );
}

export default Recurrings;

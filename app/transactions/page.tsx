import {
  transactionsProp,
  TrxType,
} from "../_components/overview/Transactions";
import Transaction from "../_components/transactions/Transaction";
import Empty from "../_components/ui/Empty";
import { getTransaction, getTransactions, ownerdata } from "../_lib/actions";

export const metadata = {
  title: "All transactions",
};

async function page() {
  const data = await getTransaction();

  if (!data?.transactions.length)
    return (
      <div className="w-full h-screen">
        <Empty name="Transactions" />
      </div>
    );

  return <Transaction transactions={data?.transactions} />;
}

export default page;

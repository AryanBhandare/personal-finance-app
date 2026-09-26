import { getTransaction } from "@/app/_lib/actions";
import AIInsights from "./AIInsights";
import BalanceItem from "./BalanceItem";
import {
  LuArrowLeftRight,
  LuCalendarClock,
  LuPieChart,
  LuPiggyBank,
} from "react-icons/lu";
import Budgets from "./Budgets";
import GridItems, { FlexItems, HeaderGrid, LinkButton } from "./GridItems";
import Pots from "./Pots";
import Recurring from "./Recurring";
import Transactions, { TrxType } from "./Transactions";

async function Overview() {
  const data = await getTransaction();

  const { transactions, budgets, pots } = data || [];

  const recuTrans = transactions?.filter(
    (transaction: TrxType) => transaction.recurring === true,
  );

  const balanceDetails = [
    { balance: data?.balance?.current, title: "Current Balance" },
    { balance: data?.balance?.income, title: "Income" },
    { balance: data?.balance?.expenses, title: "Expenses" },
  ];

  return (
    <div className="">
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {balanceDetails?.map((balance, index) => (
          <BalanceItem key={index} {...balance} />
        ))}
      </div>
      {data ? (
        <div className="mt-6 md:mt-8">
          <AIInsights />
        </div>
      ) : null}
      <div className="grid xl:grid-cols-[1.5fr,1fr] gap-6 mt-6 md:mt-8">
        {!data ? (
          <p>No transactions on your account yet</p>
        ) : (
          <>
            <div className="flex flex-col gap-6">
              <GridItems>
                <FlexItems>
                  <HeaderGrid icon={<LuPiggyBank size={18} />}>Pots</HeaderGrid>
                  <LinkButton href="/pots">See Details</LinkButton>
                </FlexItems>

                <Pots potsItems={pots} />
              </GridItems>

              <GridItems>
                <FlexItems>
                  <HeaderGrid icon={<LuArrowLeftRight size={18} />}>
                    Transactions
                  </HeaderGrid>

                  <LinkButton href="/transactions">View All</LinkButton>
                </FlexItems>
                <Transactions transactions={transactions} />
              </GridItems>
            </div>

            <div className="flex flex-col gap-6">
              <GridItems>
                <FlexItems>
                  <HeaderGrid icon={<LuPieChart size={18} />}>
                    Budgets
                  </HeaderGrid>
                  <LinkButton href="/budgets">See Details</LinkButton>
                </FlexItems>

                <Budgets budgets={budgets} />
              </GridItems>

              <GridItems>
                <FlexItems>
                  <HeaderGrid icon={<LuCalendarClock size={18} />}>
                    Recurring Bills
                  </HeaderGrid>

                  <LinkButton href="/recurring_bills">See Details</LinkButton>
                </FlexItems>

                <Recurring recurringTrans={recuTrans} />
              </GridItems>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Overview;

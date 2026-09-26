import { getTransaction } from "@/app/_lib/actions";
import BudgetsItems, { BudgetsSummaryItems } from "./BudgetsItem";
import { budgetsProps } from "../overview/Budgets";
import { TransactionProps } from "../transactions/Transaction";
import { TrxType } from "../overview/Transactions";
import Empty from "../ui/Empty";

type userID = {
  userId: string | undefined;
};
async function Budget() {
  const data = await getTransaction();

  type BudgetProps = {
    id: number; // Add id to BudgetProps
    category: string;
    maximum: number;
    theme: string;
  };

  type DataProps = {
    transactions: TrxType[];
    budgets: BudgetProps[];
  };

  const { transactions, budgets } = data;

  const findTransactionsInBudgets = (): TrxType[] => {
    // Create a Set for budget categories (normalized to lowercase)
    const budgetCategories = new Set(
      budgets?.map((bud: BudgetProps) => bud.category.toLowerCase()),
    );

    // Filter transactions based on budget categories
    return transactions.filter((trans: TrxType) =>
      trans.category
        ? budgetCategories.has(trans.category.toLowerCase())
        : false,
    );
  };

  const transBudge = findTransactionsInBudgets();

  // Combine transactions and budgets by category
  const combineData = (): any[] => {
    // Create a map to store combined data by category
    const combinedMap: Record<string, any> = {};

    // Process transactions
    transBudge?.forEach((trx: TrxType) => {
      if (trx.category) {
        // Initialize category if not already present
        if (!combinedMap[trx.category]) {
          combinedMap[trx.category] = {
            category: trx.category,
            transactions: [],
            theme: "", // Default theme
            maximum: 0, // Default maximum
            budgetId: null, // Default id (we'll update this later)
          };
        }
        // Add transaction to the category
        combinedMap[trx.category].transactions.push(trx);
      }
    });

    // Process budgets
    budgets.forEach((budget: BudgetProps) => {
      if (combinedMap[budget.category]) {
        // Update combined data with budget properties, including the id
        combinedMap[budget.category].theme = budget.theme;
        combinedMap[budget.category].maximum = budget.maximum;
        combinedMap[budget.category].budgetId = budget.id; // Add budget id
      }
    });

    // Convert the combinedMap to an array
    return Object.values(combinedMap);
  };

  const datay = combineData();

  if (!budgets.length && !transactions.length)
    return (
      <div className="w-full h-screen">
        <Empty name="Budgets" />
      </div>
    );

  return (
    <div className="grid xl:grid-cols-[1fr,1.4fr] gap-6 items-start">
      <div className="xl:sticky xl:top-8">
        <BudgetsSummaryItems transactions={datay || budgets} />
      </div>
      <div className="flex flex-col gap-6">
        <BudgetsItems transactions={datay.length ? datay : budgets} />
      </div>
    </div>
  );
}

export default Budget;

// import { cookies } from "next/headers";
import Budget from "../_components/budgets/Budget";

export const metadata = {
  title: "Keep track of your spending ",
};

function page() {
  // const id = cookies().get("user")?.value.trim();

  return <Budget />;
}

export default page;

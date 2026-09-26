import { getTransaction } from "@/app/_lib/actions";
import PotsItem from "./PotsItem";
import Empty from "../ui/Empty";

export type potsProp = {
  name: string;
  target: number;
  total: number;
  theme: string;
  id: string;
  // maximum?: number;
};

async function Pots() {
  const { pots } = await getTransaction();

  if (!pots?.length)
    return (
      <div className="w-full h-screen">
        <Empty name="Pots" />
      </div>
    );

  return (
    <div className="md:grid-cols-2 grid gap-4 md:gap-6">
      {pots.map((item: potsProp, i: number) => (
        <PotsItem item={item} key={i} />
      ))}
    </div>
  );
}

export default Pots;

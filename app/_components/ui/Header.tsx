import User from "../overview/User";
import Button from "./Button";
import { signOutAction } from "@/app/_lib/actions";
import { MdLogout } from "react-icons/md";
import { LuPlus, LuSend } from "react-icons/lu";

type HeaderProps = {
  pathName: string;
  openModal: () => void;
};

function Header({ pathName, openModal }: HeaderProps) {
  async function handleLogout() {
    await signOutAction();
  }
  return (
    <div className="w-full flex flex-wrap justify-between items-center gap-4 mb-6 md:mb-8">
      <h1 className="min-w-0 text-[26px] sm:text-[28px] md:text-[32px] leading-tight tracking-tight text-grey-900 font-bold capitalize">
        {pathName === "overview" ? <User /> : pathName}
      </h1>
      {(pathName === "pots" || pathName === "budgets") && (
        <Button onClick={openModal} className="shrink-0">
          <LuPlus size={18} />
          <span className="hidden sm:inline">
            Add New {pathName.replace("s", "")}
          </span>
        </Button>
      )}

      {pathName === "overview" ? (
        <Button onClick={openModal} className="shrink-0">
          <LuSend size={16} />
          <span>transfer</span>
        </Button>
      ) : pathName === "settings" ? (
        <Button className="flex items-center gap-2" onClick={handleLogout}>
          <MdLogout />
          <p>logout</p>
        </Button>
      ) : null}
    </div>
  );
}

export default Header;

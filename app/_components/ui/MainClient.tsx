"use client";

import { ReactNode, useState } from "react";
import LeftNav from "./LeftNav";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { getData } from "@/app/_lib/dats-services";
import Modal from "./Modal";
import BudgtForm from "../budgets/BudgtForm";
import { usePathname } from "next/navigation";
import PotsForm from "../pots/PotsForm";
import User from "../overview/User";
import TrxForm from "../overview/TrxForm";

type mainProps = {
  children: ReactNode;
};

function MainClient({ children }: mainProps) {
  const [menuSow, setMenuShow] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const pathname = usePathname();
  let pathName =
    pathname === "/signup" || pathname === "/login"
      ? ""
      : pathname === "/"
        ? "overview"
        : pathname.replace("_", " ").replace("/", "");

  const data = getData();

  function handleMenuShow() {
    setMenuShow((shm) => !shm);
  }

  return (
    <main className={`w-full h-full min-h-screen relative`}>
      {pathname === "/signup" || pathname === "/login" ? null : (
        <>
          <LeftNav menuSow={menuSow} handleMenuShow={handleMenuShow} />
          <BottomNav />
        </>
      )}
      <div
        className={`${
          pathname === "/signup" || pathname === "/login"
            ? "!pt-0 !pb-0 !px-0"
            : menuSow
              ? "xl:pl-[344px] lg:pl-[284px]"
              : "lg:pl-[132px]"
        } pt-6 md:pt-8 pb-28 md:pb-32 lg:pb-12 lg:pr-10 px-4 sm:px-6 md:px-8 z-30 transition-[padding] duration-500`}
      >
        {pathname === "/budgets" ? (
          <Modal title="Add New Budget" isOpen={showModal} onClose={closeModal}>
            <BudgtForm type="new" message="" close={closeModal} />
          </Modal>
        ) : pathname === "/pots" ? (
          <Modal title="Add New Pot" isOpen={showModal} onClose={closeModal}>
            <PotsForm type="new" message="" close={closeModal} />
          </Modal>
        ) : pathname === "/" ? (
          <Modal title="Transfer" isOpen={showModal} onClose={closeModal}>
            <TrxForm close={closeModal} />
          </Modal>
        ) : null}
        <div className="max-w-[1440px] mx-auto">
          {pathName ? (
            <Header pathName={pathName} openModal={openModal} />
          ) : null}
          <div key={pathname} className="animate-fade-up">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export default MainClient;

"use client";
import { LuPiggyBank } from "react-icons/lu";
import { getThemeHex } from "@/app/_lib/theme";

import Image from "next/image";
import GridItems, { FlexItems } from "../overview/GridItems";
import { potsProp } from "./Pots";

import menu from "@/public/assets/images/icon-ellipsis.svg";
import { calculatePercentage, formatCurrency } from "@/app/_lib/dats-services";
import Button from "../ui/Button";
import { useState } from "react";
import Modal from "../ui/Modal";
import PotsForm, { FormEdit } from "./PotsForm";
import DeleteModal from "../ui/DeleteModal";
import { deletePots } from "@/app/_lib/actions";
import WithdrawalAddForm from "./WithdrawalAddForm";

type propsPots = {
  item: potsProp;
};

function PotsItem({ item }: propsPots) {
  const [openMenu, setOpenMen] = useState({
    menu: false,
    modal: { open: false, toOpen: "" },
  });

  // const [addWithd, setAddWithd] = useState({
  //   add: { open: false },
  //   widthdrawal: { open: false },
  // });

  const [isLoading, setIsLoading] = useState(false);

  function handleOpenMenu() {
    setOpenMen((prevState) => ({
      ...prevState,
      menu: !prevState.menu,
    }));
  }

  function handleOpenModal(type: string) {
    if (type === "edit") {
      setOpenMen((prevState) => ({
        ...prevState,
        modal: { open: true, toOpen: "edit" },
      }));
    } else if (type === "delete")
      setOpenMen((prevState) => ({
        ...prevState,
        modal: { open: true, toOpen: "delete" },
      }));
    handleOpenMenu();
  }

  function handleOpenAddWidth(type: "add" | "withdraw") {
    if (type === "add") {
      setOpenMen((prevState) => ({
        ...prevState,
        modal: { open: true, toOpen: "add" },
      }));
    } else if (type === "withdraw")
      setOpenMen((prevState) => ({
        ...prevState,
        modal: { open: true, toOpen: "withdraw" },
      }));
  }

  function handleCloseModal() {
    setOpenMen((prevState) => ({
      ...prevState,
      modal: { open: false, toOpen: "" },
    }));
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      if (item.total > 0) {
        alert("Cannot delete pot with available savings");
        return;
      }
      await deletePots(item.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      handleCloseModal();
    }
  }

  const { theme } = item;
  return (
    <GridItems className="relative flex flex-col gap-6 hover:shadow-card-hover">
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-2xl"
        style={{ backgroundColor: getThemeHex(theme) }}
      />
      {openMenu.modal.toOpen == "edit" && (
        <Modal
          isOpen={openMenu.modal.open}
          onClose={handleCloseModal}
          title={`Edit ${item.name} pot`}
        >
          <PotsForm type="edit" message="" editPots={item} />
        </Modal>
      )}

      {openMenu.modal.toOpen == "delete" && (
        <Modal
          isOpen={openMenu.modal.open}
          onClose={handleCloseModal}
          title={`Delete '${item.name} pot' `}
        >
          <DeleteModal
            item="Pot"
            deleteFn={handleDelete}
            close={handleCloseModal}
            loading={isLoading}
          />
        </Modal>
      )}

      {openMenu.modal.toOpen == "add" && (
        <Modal
          isOpen={openMenu.modal.open}
          onClose={handleCloseModal}
          title={`Add to '${item.name}' `}
        >
          <WithdrawalAddForm item={item} type="add" close={handleCloseModal} />
        </Modal>
      )}

      {openMenu.modal.toOpen == "withdraw" && (
        <Modal
          isOpen={openMenu.modal.open}
          onClose={handleCloseModal}
          title={`Withdraw from '${item.name}' `}
        >
          <WithdrawalAddForm
            item={item}
            type="withdraw"
            close={handleCloseModal}
          />
        </Modal>
      )}
      <FlexItems className="relative">
        <div className="flex items-center gap-3">
          <span
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${getThemeHex(theme)}1f`,
              color: getThemeHex(theme),
            }}
          >
            <LuPiggyBank size={20} />
          </span>
          <h1 className="text-xl font-bold tracking-tight">{item.name}</h1>
        </div>

        <button
          className="w-8 h-8 -mr-2 rounded-full flex relative items-center justify-center hover:bg-beige-100"
          onClick={handleOpenMenu}
          aria-label="Pot options"
        >
          <span className="w-4 h-1 relative">
            <Image src={menu} alt="Menu" fill />
          </span>
        </button>
        {openMenu.menu ? (
          <FormEdit handleEdit={handleOpenModal} type="pots" className="" />
        ) : null}
      </FlexItems>

      <FlexItems>
        <p className="text-grey-500 text-sm">Total Saved</p>
        <h1 className="text-[26px] sm:text-[32px] leading-none font-bold tracking-tight tabular-nums">
          {formatCurrency(item.total)}
        </h1>
      </FlexItems>

      <div className="w-full h-2 rounded-full z-20 bg-beige-100 overflow-hidden">
        <div
          style={{
            width: `${calculatePercentage(item.total, item.target).toFixed(
              2
            )}%`,
          }}
          className={`h-full max-w-full rounded-full z-30 transition-[width] duration-700 ease-out ${
            theme === "green"
              ? "bg-secondary-green"
              : theme === "yellow"
              ? "bg-secondary-yellow"
              : theme === "cyan"
              ? "bg-secondary-cyan"
              : theme === "navy"
              ? "bg-secondary-navy"
              : theme === "red"
              ? "bg-secondary-red"
              : theme === "purple"
              ? "bg-secondary-purple"
              : theme === "lightPurple"
              ? "bg-secondary-lightPurple"
              : theme === "turquoise"
              ? "bg-secondary-turquoise"
              : theme === "brown"
              ? "bg-secondary-brown"
              : theme === "magenta"
              ? "bg-secondary-magenta"
              : theme === "blue"
              ? "bg-secondary-blue"
              : theme === "navyGrey"
              ? "bg-secondary-navyGrey"
              : theme === "amyGreen"
              ? "bg-secondary-amyGreen"
              : theme === "gold"
              ? "bg-secondary-gold"
              : theme === "orange"
              ? "bg-secondary-orange"
              : ""
          }`}
        ></div>
      </div>
      <FlexItems>
        <p className="text-grey-900 text-xs font-bold tabular-nums">
          {`${calculatePercentage(item.total, item.target).toFixed(2)}%`}
        </p>
        <p className="text-grey-500 text-xs">
          Target of {formatCurrency(item.target)}
        </p>
      </FlexItems>
      <div className="flex gap-3 sm:gap-4 w-full mt-2">
        <Button
          className="w-full flex justify-center items-center"
          type="secondary"
          onClick={() => handleOpenAddWidth("add")}
        >
          + Add Money
        </Button>
        <Button
          type="secondary"
          className="w-full flex justify-center items-center"
          onClick={() => handleOpenAddWidth("withdraw")}
        >
          withdraw
        </Button>
      </div>
    </GridItems>
  );
}

export default PotsItem;

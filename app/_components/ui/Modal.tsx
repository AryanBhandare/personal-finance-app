"use client";

import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !isClient) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-grey-900/40 backdrop-blur-sm z-50 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className="rounded-2xl shadow-pop max-w-[500px] p-5 sm:p-6 md:p-8 relative bg-secondary-white w-full md:w-[480px] xl:w-[500px] animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center gap-4 mb-3">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight text-grey-900 pr-4">
                {title}
              </h2>
            )}
            <button
              className="shrink-0 text-xl leading-none text-grey-500 hover:text-grey-900 hover:bg-beige-100 border border-grey-300 h-8 w-8 flex items-center justify-center rounded-full transition-colors"
              onClick={onClose}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default Modal;

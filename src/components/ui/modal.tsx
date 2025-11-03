import clsx from "clsx";
import React, { type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
      onClick={onClose} // Click on backdrop closes modal
    >
      {/* Modal container */}
      <div
        className={clsx(localStorage.getItem("theme") == 'dark' ? "bg-slate-800" : "bg-white", "rounded-xl shadow-lg w-full max-w-lg mx-4 relative flex flex-col max-h-[85vh]")}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div className={clsx(localStorage.getItem("theme") == 'dark' ? "border-slate-600" : "border-slate-200", "flex items-center justify-between p-4 border-b shrink-0")}>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto grow">
          {children}
        </div>

        {/* Footer */}
        <div className={clsx(localStorage.getItem("theme") == 'dark' ? "border-slate-600" : "border-slate-200", "flex justify-end gap-2 p-4 border-t shrink-0")}>
          {footer ? (footer): (<button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Close
          </button>)}
        </div>
      </div>
    </div>
  );
};

export default Modal;

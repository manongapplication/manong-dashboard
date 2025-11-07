import clsx from "clsx";
import { CheckCircle2, XCircle } from "lucide-react";
import React from "react";

interface StatusAlertDialogProps {
  isOpen: boolean;
  type: "success" | "error";
  title?: string;
  message?: string;
  onClose: () => void;
}

const StatusAlertDialog: React.FC<StatusAlertDialogProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={clsx(
          localStorage.getItem("theme") == "dark" ? "bg-slate-800" : "bg-white",
          "rounded-xl shadow-lg w-full max-w-sm mx-4 relative animate-fadeIn p-6 text-center",
          type === "success"
            ? "border border-green-200"
            : "border border-red-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-3">
          {type === "success" ? (
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          ) : (
            <XCircle className="w-12 h-12 text-red-500" />
          )}
        </div>

        <h3
          className={clsx(
            "text-lg font-semibold mb-2",
            type === "success" ? "text-green-700" : "text-red-700"
          )}
        >
          {title || (type === "success" ? "Success!" : "Error")}
        </h3>

        <p
          className={clsx(
            "text-sm mb-4",
            localStorage.getItem("theme") == "dark"
              ? "text-slate-300"
              : "text-slate-600"
          )}
        >
          {message}
        </p>

        <button
          onClick={onClose}
          className={clsx(
            "px-5 py-2 rounded-md text-white font-medium transition w-full",
            type === "success"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          )}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default StatusAlertDialog;

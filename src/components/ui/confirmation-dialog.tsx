// components/ui/custom-confirmation-dialog.tsx
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const variantClasses = {
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    info: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  };

  const buttonClasses = {
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  const iconColors = {
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onCancel}></div>
      
      {/* Dialog Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Dialog */}
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all w-full max-w-md">
          {/* Content */}
          <div className={`p-6 ${variantClasses[variant]}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className={`h-6 w-6 ${iconColors[variant]}`} />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onCancel}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonClasses[variant]}`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
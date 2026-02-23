// components/ui/payout-card.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { PayoutForm } from '@/pages/PayoutsPage'
import type { ManongWalletTransaction } from "@/types/manong-wallet-transaction";
import { WalletTransactionStatus } from "@/types/wallet-transaction-status";
import { Copy, Wallet, Banknote, Calendar, ChevronDown, ChevronUp, User, Check, X } from "lucide-react";
import ConfirmationDialog from '@/components/ui/confirmation-dialog';

interface PayoutCardProps {
  transaction: ManongWalletTransaction;
  isEditing?: boolean;
  onUpdate: (id: number, data: Partial<ManongWalletTransaction>) => void;
  onSave?: (transaction: ManongWalletTransaction) => Promise<void>;
  onCompletePayout?: (id: number) => Promise<void>;
  onMarkAsFailed?: (id: number) => Promise<void>;
  completingPayout?: boolean;
  markingAsFailed?: boolean;
}

const PayoutCard: React.FC<PayoutCardProps> = ({ 
  transaction, 
  isEditing, 
  onUpdate,
  onSave,
  onCompletePayout,
  onMarkAsFailed,
  completingPayout,
  markingAsFailed
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullData, setShowFullData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showFailedConfirm, setShowFailedConfirm] = useState(false);

  // Parse data JSON
  useEffect(() => {
    if (transaction.metadata) {
      try {
        setData(JSON.parse(transaction.metadata));
      } catch (e) {
        console.error('Error parsing data:', e);
        setData(null);
      }
    }
  }, [transaction.metadata]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    getValues
  } = useForm<PayoutForm>();

  // Initialize form
  useEffect(() => {
    reset({
      status: transaction.status,
      description: transaction.description || '',
      amount: transaction.amount,
    });
    setHasChanges(false);
  }, [transaction, reset]);

  // Reset form when exiting edit mode
  useEffect(() => {
    if (!isEditing) {
      reset({
        status: transaction.status,
        description: transaction.description || '',
        amount: transaction.amount,
      });
      setShowFullDescription(false);
      setShowFullData(false);
      setHasChanges(false);
    }
  }, [isEditing, transaction, reset]);

  // Watch for form changes
  useEffect(() => {
    if (isEditing) {
      const subscription = watch((formData) => {
        
        const hasFormChanges = 
          formData.status !== transaction.status ||
          formData.description !== (transaction.description || '') ||
          (formData.amount !== undefined && formData.amount !== transaction.amount);
        
        setHasChanges(hasFormChanges);

        if (hasFormChanges) {
          const updatedData: Partial<ManongWalletTransaction> = {};
          
          if (formData.status !== transaction.status) {
            updatedData.status = formData.status as WalletTransactionStatus;
          }
          
          if (formData.description !== (transaction.description || '')) {
            updatedData.description = formData.description || null;
          }
          
          if (formData.amount !== undefined && formData.amount !== transaction.amount) {
            updatedData.amount = Number(formData.amount);
          }
          
          onUpdate(transaction.id, updatedData);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [watch, isEditing, transaction, onUpdate, getValues]);

  const onSubmit = async (formData: PayoutForm) => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      const formattedData: ManongWalletTransaction = {
        ...transaction,
        status: formData.status,
        description: formData.description || null,
        amount: Number(formData.amount),
      };
      
      await onSave(formattedData);
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setSaving(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'failed': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payout': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'earning': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'job_fee': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'topup': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'adjustment': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'refund': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  }

  const formatCurrency = (amount: number, currency = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
    });
  };

  const getAccountDetails = () => {
    if (!data || transaction.type !== 'payout') return null;
    
    return {
      bankCode: data.bankCode,
      bankName: data.bankName || data.bank_name || data.bank,
      accountName: data.accountName || data.account_name || data.name,
      accountNumber: data.accountNumber || data.account_number || data.account,
    };
  }

  const handleCompletePayout = async () => {
    if (onCompletePayout) {
      try {
        await onCompletePayout(transaction.id);
        setShowCompleteConfirm(false);
      } catch (error) {
        console.error('Error completing payout:', error);
      }
    }
  };

  const handleMarkAsFailed = async () => {
    if (onMarkAsFailed) {
      try {
        await onMarkAsFailed(transaction.id);
        setShowFailedConfirm(false);
      } catch (error) {
        console.error('Error marking payout as failed:', error);
      }
    }
  };

  const accountDetails = getAccountDetails();
  const manongName = transaction.wallet?.manong 
    ? `${transaction.wallet.manong.firstName || ''} ${transaction.wallet.manong.lastName || ''}`.trim()
    : null;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg shadow-sm p-4 flex flex-col gap-3 border border-gray-700 hover:shadow-md transition-shadow bg-white dark:bg-gray-900 relative">
        {/* Card Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-semibold truncate dark:text-gray-200">Transaction #{transaction.id}</h2>
              <button
                onClick={() => copyToClipboard(transaction.id.toString())}
                className="cursor-pointer p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Copy ID"
                type="button"
              >
                <Copy size={12} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(transaction.type)}`}>
                {transaction.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Action buttons for payouts */}
          {transaction.type === 'payout' && !isEditing && (
            <div className="flex flex-col gap-1 ml-2">
              {transaction.status === 'pending' && onCompletePayout && (
                <button
                  type="button"
                  onClick={() => setShowCompleteConfirm(true)}
                  disabled={completingPayout}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1 min-w-[80px] justify-center"
                  title="Complete Payout"
                >
                  {completingPayout ? (
                    <span className="flex items-center gap-1">
                      <div className="h-2 w-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Processing
                    </span>
                  ) : (
                    <>
                      <Check size={12} /> Complete
                    </>
                  )}
                </button>
              )}
              
              {transaction.status !== 'failed' && onMarkAsFailed && (
                <button
                  type="button"
                  onClick={() => setShowFailedConfirm(true)}
                  disabled={markingAsFailed}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1 min-w-[80px] justify-center"
                  title="Mark as Failed"
                >
                  {markingAsFailed ? (
                    <span className="flex items-center gap-1">
                      <div className="h-2 w-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Processing
                    </span>
                  ) : (
                    <>
                      <X size={12} /> Fail
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          
          {/* Save button for individual card */}
          {isEditing && hasChanges && onSave && (
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        {/* Manong Info */}
        {manongName && (
          <div className="flex items-center gap-2 text-xs">
            <User size={12} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Manong:</span>
            <span className="font-medium dark:text-gray-300">{manongName}</span>
          </div>
        )}

        {/* Transaction Info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Banknote size={12} />
              Amount:
            </p>
            {isEditing ? (
              <input
                {...register('amount', { 
                  required: 'Amount is required',
                  valueAsNumber: true,
                  validate: (value: number | undefined) => {
                    if (value === undefined || value === null) return 'Amount is required';
                    if (isNaN(value)) return 'Amount must be a number';
                    return true;
                  }
                })}
                type="number"
                step="0.01"
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-200"
              />
            ) : (
              <p className={`text-sm font-bold ${
                transaction.type === 'payout' || transaction.type === 'job_fee' || transaction.type === 'refund'
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
            )}
            {errors.amount && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.amount.message}</p>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Wallet size={12} />
              Wallet:
            </p>
            <p className="dark:text-gray-300">#{transaction.walletId}</p>
          </div>
        </div>

        {/* Payout Details - Only for payout type */}
        {transaction.type === 'payout' && accountDetails && (
          <div className="p-2 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Payout Details</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {accountDetails.bankName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                  <span className="font-medium dark:text-gray-300">{accountDetails.bankName}</span>
                </div>
              )}
              {accountDetails.bankCode && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bank Code:</span>
                  <span className="font-medium dark:text-gray-300">{accountDetails.bankCode}</span>
                </div>
              )}
              {accountDetails.accountName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account Name:</span>
                  <span className="font-medium dark:text-gray-300">{accountDetails.accountName}</span>
                </div>
              )}
              {accountDetails.accountNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium dark:text-gray-300">{accountDetails.accountNumber}</span>
                    <button
                      onClick={() => copyToClipboard(accountDetails.accountNumber.toString())}
                      className="cursor-pointer p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Copy account number"
                      type="button"
                    >
                      <Copy size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isEditing ? (
          <>
            {/* Edit Form Fields */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select 
                {...register('status', { 
                  required: 'Status is required!'
                })}
                className="select w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              {errors.status && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.status.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea 
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-200"
                placeholder="Transaction description"
                rows={2}
              />
            </div>

            {hasChanges && (
              <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-400">
                Unsaved changes
              </div>
            )}
          </>
        ) : (
          <>
            {/* View Mode */}
            {/* Description - Compact */}
            <div className="min-h-[40px]">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description:</p>
              <div className="text-xs">
                {transaction.description ? (
                  <div>
                    <p className={`dark:text-gray-300 ${showFullDescription ? "whitespace-pre-wrap break-words" : "line-clamp-2 overflow-hidden text-ellipsis"}`}>
                      {transaction.description}
                    </p>
                    {transaction.description.length > 80 && (
                      <button
                        type="button"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs mt-0.5 font-medium"
                      >
                        {showFullDescription ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 italic text-xs">No description</p>
                )}
              </div>
            </div>
            
            {/* Raw Data - Compact */}
            {data && (
              <div className="border-t border-gray-700 pt-3">
                <button
                  onClick={() => setShowFullData(!showFullData)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  type="button"
                >
                  <span>Transaction Data</span>
                  {showFullData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showFullData && (
                  <div className="mt-3 p-2 border border-gray-700 rounded text-xs">
                    <pre className="whitespace-pre-wrap break-words text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Dates - Compact */}
            <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center pt-3 border-t border-gray-700">
              <div className="flex items-center gap-1">
                <Calendar size={10} />
                <span>Created: {formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={10} />
                <span>Updated: {formatDate(transaction.updatedAt)}</span>
              </div>
            </div>
          </>
        )}
      </form>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showCompleteConfirm}
        title="Complete Payout"
        message={`Are you sure you want to complete payout #${transaction.id} for ${formatCurrency(transaction.amount, transaction.currency)}? This will deduct the amount from the pending balance.`}
        confirmText={completingPayout ? "Processing..." : "Complete Payout"}
        variant="warning"
        onConfirm={handleCompletePayout}
        onCancel={() => setShowCompleteConfirm(false)}
      />

      <ConfirmationDialog
        isOpen={showFailedConfirm}
        title="Mark Payout as Failed"
        message={`Are you sure you want to mark payout #${transaction.id} as failed? This may return the amount to pending balance if it was already completed.`}
        confirmText={markingAsFailed ? "Processing..." : "Mark as Failed"}
        variant="danger"
        onConfirm={handleMarkAsFailed}
        onCancel={() => setShowFailedConfirm(false)}
      />
    </>
  );
};

export default PayoutCard;
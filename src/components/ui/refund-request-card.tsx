import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { RefundRequestsForm } from "@/pages/RefundRequestsPage";
import type { RefundRequest } from "@/types/refund-request";
import { RefundStatus } from "@/types/refund-status";

interface RefundRequestCardProps {
  refundRequest: RefundRequest;
  isEditing?: boolean;
  onUpdate: (id: number, data: Partial<RefundRequest>) => void;
}

const RefundRequestCard: React.FC<RefundRequestCardProps> = ({ 
  refundRequest, 
  isEditing, 
  onUpdate 
}) => {
  const [localData, setLocalData] = useState<Partial<RefundRequest>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFullReason, setShowFullReason] = useState(false);
  const [showFullRemarks, setShowFullRemarks] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<RefundRequestsForm>();

  // Calculate if refund can be processed (1-2 business days after creation)
  const canProcessRefund = () => {
    // If already processed, return true
    if (refundRequest.status === 'processed' || refundRequest.status === 'approved') {
      return true;
    }

    const createdAt = new Date(refundRequest.createdAt);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // Check payment method - if Paymongo (card/gcash/paymaya), need 7 days
    const paymentMethod = refundRequest.serviceRequest?.paymentTransactions?.[0]?.provider;
    const isPaymongoPayment = paymentMethod && 
      ['card', 'gcash', 'paymaya', 'billease', 'dob', 'grab_pay'].includes(paymentMethod.toLowerCase());
    
    // If Paymongo payment: need 7 days
    // If Cash or unknown: need 24 hours (1 day)
    const requiredDays = isPaymongoPayment ? 7 : 1;
    
    return daysDiff >= requiredDays;
  };

  const getTimeRemaining = () => {
    if (refundRequest.status === 'processed' || refundRequest.status === 'approved') {
      return "Completed";
    }

    const createdAt = new Date(refundRequest.createdAt);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // Check payment method
    const paymentMethod = refundRequest.serviceRequest?.paymentTransactions?.[0]?.provider;
    const isPaymongoPayment = paymentMethod && 
      ['card', 'gcash', 'paymaya'].includes(paymentMethod.toLowerCase());
    
    const requiredDays = isPaymongoPayment ? 7 : 1;
    const daysRemaining = requiredDays - daysDiff;
    
    if (daysRemaining <= 0) {
      return "Ready to process";
    } else if (daysRemaining > 1) {
      return `${Math.ceil(daysRemaining)} days remaining`;
    } else {
      const hoursRemaining = Math.ceil(24 - (daysDiff * 24));
      return `${hoursRemaining}h remaining`;
    }
  };

  // Check if status is NOT approved
  const isNotApproved = refundRequest.status !== 'approved';

  // Initialize form only once when component mounts or when refundRequest changes fundamentally
  useEffect(() => {
    if (!isInitialized) {
      reset({
        status: refundRequest.status,
        reason: refundRequest.reason || '',
        remarks: refundRequest.remarks || '',
      });
      setIsInitialized(true);
    }
  }, [refundRequest, reset, isInitialized]);

  // Reset form when exiting edit mode to discard changes
  useEffect(() => {
    if (!isEditing) {
      reset({
        status: refundRequest.status,
        reason: refundRequest.reason || '',
        remarks: refundRequest.remarks || '',
      });
      setLocalData({});
      setIsInitialized(true);
      setShowFullReason(false);
      setShowFullRemarks(false);
    }
  }, [isEditing, refundRequest, reset]);

  // Watch for form changes and update parent only when needed
  useEffect(() => {
    if (isEditing && isInitialized) {
      const subscription = watch((formData) => {
        const updatedData: Partial<RefundRequest> = {};
        let hasChanges = false;

        if (formData.status !== refundRequest.status) {
          updatedData.status = formData.status as RefundStatus;
          hasChanges = true;
        }

        if (formData.reason !== (refundRequest.reason || '')) {
          updatedData.reason = formData.reason || null;
          hasChanges = true;
        }

        if (formData.remarks !== (refundRequest.remarks || '')) {
          updatedData.remarks = formData.remarks || null;
          hasChanges = true;
        }

        if (hasChanges) {
          setLocalData(updatedData);
          onUpdate(refundRequest.id, updatedData);
        } else {
          setLocalData({});
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [watch, isEditing, refundRequest, onUpdate, isInitialized]);

  const onSubmit = (data: RefundRequestsForm) => {
    const formattedData: Partial<RefundRequest> = {
      status: data.status,
      reason: data.reason || null,
      remarks: data.remarks || null,
    };
    
    onUpdate(refundRequest.id, formattedData);
  }

  const getStatusColor = (status: RefundStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'processed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'unpaid': return 'bg-red-100 text-red-600 border-red-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'failed': return 'bg-red-100 text-red-900 border-red-300';
      case 'refunding': return 'bg-purple-100 text-purple-500 border-purple-200';
      case 'refunded': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const getServiceStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired':
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunding': return 'bg-purple-100 text-purple-500 border-purple-200';
      case 'inprogress': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg shadow-sm p-4 flex flex-col gap-3 border border-gray-600 hover:shadow-md transition-shadow">
      {isEditing ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Status
            </label>
            <select 
              {...register('status', { 
                required: 'Status is required!'
              })}
              className="select w-full px-3 py-2 rounded-md text-sm"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option 
                value="processed"
                disabled={!canProcessRefund()}
              >
                Processed {!canProcessRefund() && '(Wait 24h)'}
              </option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
            )}
            {!canProcessRefund() && (
              <p className="text-orange-600 text-xs mt-1">
                ⏰ {getTimeRemaining()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Reason
            </label>
            <textarea 
              {...register('reason')}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="Customer's refund reason"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Remarks
            </label>
            <textarea 
              {...register('remarks')}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="Admin remarks"
              rows={2}
            />
          </div>

          {/* Refund Timing Information - Compact */}
          {isNotApproved && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <p className="font-medium">Timing:</p>
              <p>
                {getTimeRemaining()} • Created: {formatDate(refundRequest.createdAt)}
              </p>
            </div>
          )}

          {Object.keys(localData).length > 0 && (
            <div className="px-2 py-1 bg-yellow-100 border border-yellow-200 rounded text-xs text-yellow-800">
              Unsaved changes
            </div>
          )}
        </>
      ) : (
        <>
          {/* Compact Header with Status */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold truncate">Request #{refundRequest.id}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(refundRequest.status)}`}>
                  {refundRequest.status.charAt(0).toUpperCase() + refundRequest.status.slice(1)}
                </span>
                
                {/* Timing status - only show when relevant */}
                {isNotApproved && refundRequest.status !== 'processed' && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    canProcessRefund() 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-orange-50 border border-orange-200 text-orange-700'
                  }`}>
                    ⏰ {getTimeRemaining()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Compact Service Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-medium text-gray-600">Service:</p>
              <p className="truncate">#{refundRequest.serviceRequest?.requestNumber}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">User:</p>
              <p>#{refundRequest.userId}</p>
            </div>
          </div>

          {/* Payment & Service Status - Compact */}
          <div className="flex flex-wrap gap-2 text-xs">
            {refundRequest.paymentTransactionId && (
              <span className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-gray-800">
                Payment: #{refundRequest.paymentTransactionId}
              </span>
            )}
            {refundRequest.serviceRequest?.paymentStatus && (
              <span className={`px-2 py-0.5 rounded border ${getPaymentStatusColor(refundRequest.serviceRequest.paymentStatus)}`}>
                {refundRequest.serviceRequest.paymentStatus.toUpperCase()}
              </span>
            )}
            {refundRequest.serviceRequest?.status && (
              <span className={`px-2 py-0.5 rounded border ${getServiceStatusColor(refundRequest.serviceRequest.status)}`}>
                {refundRequest.serviceRequest.status.toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Reason - Compact */}
          <div className="min-h-[40px]">
            <p className="text-xs font-medium text-gray-600 mb-1">Reason:</p>
            <div className="text-xs">
              {refundRequest.reason ? (
                <div>
                  <p className={`${showFullReason ? "whitespace-pre-wrap break-words" : "line-clamp-2 overflow-hidden text-ellipsis"}`}>
                    {refundRequest.reason}
                  </p>
                  {refundRequest.reason.length > 80 && (
                    <button
                      type="button"
                      onClick={() => setShowFullReason(!showFullReason)}
                      className="text-blue-600 hover:text-blue-800 text-xs mt-0.5 font-medium"
                    >
                      {showFullReason ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 italic text-xs">No reason provided</p>
              )}
            </div>
          </div>
          
          {/* Remarks - Compact */}
          {refundRequest.remarks && (
            <div className="min-h-[35px]">
              <p className="text-xs font-medium text-gray-600 mb-1">Remarks:</p>
              <div className="text-xs">
                <p className={`${showFullRemarks ? "whitespace-pre-wrap break-words" : "line-clamp-2 overflow-hidden text-ellipsis"}`}>
                  {refundRequest.remarks}
                </p>
                {refundRequest.remarks.length > 80 && (
                  <button
                    type="button"
                    onClick={() => setShowFullRemarks(!showFullRemarks)}
                    className="text-blue-600 hover:text-blue-800 text-xs mt-0.5 font-medium"
                  >
                    {showFullRemarks ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dates - Compact */}
          <div className="text-xs text-gray-500 flex justify-between">
            <span>Created: {formatDate(refundRequest.createdAt)}</span>
            <span>Updated: {formatDate(refundRequest.updatedAt)}</span>
          </div>

          {/* Admin Note - Compact */}
          {isNotApproved && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <p>💡 Refunds process in 1-2 business days</p>
            </div>
          )}

          {refundRequest.handledManually && (
            <div className="px-2 py-1 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700 text-center">
              Manually Handled
            </div>
          )}
        </>
      )}
    </form>
  );
};

export default RefundRequestCard;
import { useState } from "react";
import { 
  MoreVertical, Eye, Edit, Trash2, CheckCircle, Ban, 
  MapPin, User, Calendar, DollarSign, Phone, Wrench, 
  AlertCircle, Package, Clock,
  Notebook
} from "lucide-react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import type { ServiceRequest } from "@/types";
import type { UpdateServiceRequestForm } from "@/pages/ServiceRequestsPage";

interface ServiceRequestCardProps {
  request: ServiceRequest;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: UpdateServiceRequestForm) => Promise<void>;
  onViewDetails: (request: ServiceRequest) => void;
  onViewReport?: (request: ServiceRequest) => void;
  isDark?: boolean;
}

const ServiceRequestCard = ({
  request,
  isSelected,
  onToggleSelect,
  onDelete,
  onUpdate,
  onViewDetails,
  onViewReport,
  isDark,
}: ServiceRequestCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateServiceRequestForm>();

  const handleEditClick = () => {
    setIsEditing(true);
    reset({
      status: request.status || 'pending',
      notes: request.notes || '',
      total: request.total || 0,
      manongId: request.manongId,
      paymentStatus: request.paymentStatus,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const onSubmit = async (data: UpdateServiceRequestForm) => {
    try {
      await onUpdate(request.id, data);
      setIsEditing(false);
      reset();
    } catch (error) {
      console.error('Failed to update service request:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-700 border-gray-200";
    
    switch (status.toLowerCase()) {
      case "awaitingacceptance":
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "accepted":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "inprogress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
      case "failed":
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "refunding":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "expired":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-700 border-gray-200";
    
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "unpaid":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "refunded":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatStatus = (status?: string) => {
    if (!status) return "Unknown";
    
    const formatted = status
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    return formatted;
  };

  const formatCurrency = (amount?: string | number) => {
    if (!amount) return "₱0.00";
    
    const numAmount = typeof amount === 'string' 
      ? parseFloat(amount) 
      : amount;
    
    if (isNaN(numAmount)) return "₱0.00";
    
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(numAmount);
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    
    return new Date(dateObj).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceHierarchy = () => {
    const serviceItem = request.serviceItem?.title || 'Unknown Service';
    const subServiceItem = request.subServiceItem?.title || '';
    const customService = request.otherServiceName || '';
    
    if (customService) {
      return `Custom: ${customService}`;
    } else if (subServiceItem) {
      return `${serviceItem} → ${subServiceItem}`;
    } else {
      return serviceItem;
    }
  };

  const hasImages = request.imagesPath && 
    (Array.isArray(request.imagesPath) ? request.imagesPath.length > 0 : request.imagesPath);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx(
        "border rounded-lg p-5 hover:shadow-md transition-all",
        isDark 
          ? "border-slate-700 hover:border-blue-700" 
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(request.id)}
          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
        />

        {/* Request Number and Basic Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={clsx(
                "font-semibold truncate",
                isDark ? "text-white" : "text-slate-900"
              )}>
                {request.requestNumber}
              </h3>
              <div className="flex gap-1">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                    request.status
                  )}`}
                >
                  {formatStatus(request.status)}
                </span>
                {request.paymentStatus && (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getPaymentStatusColor(
                      request.paymentStatus
                    )}`}
                  >
                    {request.paymentStatus}
                  </span>
                )}
              </div>
            </div>
            
            {/* Service Hierarchy */}
            <div className="mb-2">
              <p className={clsx(
                "text-sm font-medium",
                isDark ? "text-slate-300" : "text-slate-700"
              )}>
                {getServiceHierarchy()}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className={clsx(
                "flex items-center gap-1",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                <Calendar size={12} />
                {formatDate(request.createdAt)}
              </div>
              <div className={clsx(
                "flex items-center gap-1",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                <DollarSign size={12} />
                {formatCurrency(request.total)}
              </div>
              {request.urgencyLevel?.level && (
                <div className={clsx(
                  "flex items-center gap-1",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}>
                  <Clock size={12} />
                  {request.urgencyLevel.level}
                </div>
              )}
              {hasImages && (
                <div className="flex items-center gap-1 text-blue-500">
                  <Package size={12} />
                  <span className="text-xs">Has Images</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button 
            type="button" 
            className={clsx(
              "p-1 hover:text-slate-600",
              isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-400"
            )}
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {/* Customer Info */}
        <div className={clsx(
          "flex justify-between py-2 border-b",
          isDark ? "border-slate-600" : "border-slate-100"
        )}>
          <span className={clsx(
            "flex items-center gap-1",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            <User size={14} /> Customer
          </span>
          <div className="font-medium text-right">
            <p className={isDark ? "text-white" : "text-slate-900"}>
              {request.user?.firstName} {request.user?.lastName}
            </p>
            {request.user?.phone && (
              <p className={clsx(
                "text-xs flex items-center gap-1 justify-end",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                <Phone size={10} /> {request.user.phone}
              </p>
            )}
          </div>
        </div>
        
        {/* Manong Info */}
        <div className={clsx(
          "flex justify-between py-2 border-b",
          isDark ? "border-slate-600" : "border-slate-100"
        )}>
          <span className={clsx(
            "flex items-center gap-1",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            <User size={14} /> Manong
          </span>
          <div className="font-medium text-right">
            <p className={isDark ? "text-white" : "text-slate-900"}>
              {request.manong ? `${request.manong.firstName} ${request.manong.lastName}` : 'Not assigned'}
            </p>
            {request.manong?.phone && (
              <p className={clsx(
                "text-xs flex items-center gap-1 justify-end",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                <Phone size={10} /> {request.manong.phone}
              </p>
            )}
          </div>
        </div>
        
        {/* Service Details */}
        <div className={clsx(
          "flex justify-between py-2 border-b",
          isDark ? "border-slate-600" : "border-slate-100"
        )}>
          <span className={clsx(
            "flex items-center gap-1",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            <Wrench size={14} /> Service
          </span>
          <div className="font-medium text-right">
            <p className={clsx(
              "max-w-xs truncate",
              isDark ? "text-white" : "text-slate-900"
            )}>
              {getServiceHierarchy()}
            </p>
            {request.serviceDetails && (
              <p className={clsx(
                "text-xs truncate max-w-xs",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                {request.serviceDetails}
              </p>
            )}
          </div>
        </div>
        
        {/* Payment Info */}
        <div className={clsx(
          "flex justify-between py-2 border-b",
          isDark ? "border-slate-600" : "border-slate-100"
        )}>
          <span className={clsx(
            "flex items-center gap-1",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            <DollarSign size={14} /> Payment
          </span>
          <div className="font-medium text-right">
            <p className={isDark ? "text-white" : "text-slate-900"}>
              {request.paymentMethod?.name || 'Not specified'}
            </p>
            <p className={clsx(
              "text-xs",
              isDark ? "text-slate-400" : "text-slate-500"
            )}>
              {formatCurrency(request.total)}
            </p>
          </div>
        </div>
        
        {/* Location */}
        <div className={clsx(
          "flex justify-between py-2 border-b md:col-span-2",
          isDark ? "border-slate-600" : "border-slate-100"
        )}>
          <span className={clsx(
            "flex items-center gap-1",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            <MapPin size={14} /> Address
          </span>
          <span className={clsx(
            "font-medium text-right max-w-xs truncate",
            isDark ? "text-white" : "text-slate-900"
          )}>
            {request.customerFullAddress || "N/A"}
          </span>
        </div>
        
        {/* Status (Editable) */}
        <div className={clsx(
          "flex justify-between py-2 border-b",
          isDark ? "border-slate-600" : "border-slate-100"
        )}>
          <span className={clsx(
            "flex items-center gap-1",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            <AlertCircle size={14} /> Status
          </span>
          {isEditing ? (
            <div>
              <select
                {...register("status")}
                className={clsx(
                  "select text-sm border rounded",
                  isDark 
                    ? "border-slate-600 bg-slate-700 text-white" 
                    : "border-slate-300"
                )}
              >
                <option value="awaitingAcceptance">Awaiting Acceptance</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="inProgress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
                <option value="refunding">Refunding</option>
                <option value="expired">Expired</option>
                <option value="rejected">Rejected</option>
              </select>
              {errors.status && (
                <p className="text-xs text-red-600 mt-1">{errors.status.message}</p>
              )}
            </div>
          ) : (
            <span className={clsx(
              "font-medium text-right",
              isDark ? "text-white" : "text-slate-900"
            )}>
              {formatStatus(request.status)}
            </span>
          )}
        </div>
        
        {/* Amount (Editable) */}
        <div className={clsx(
          "flex justify-between py-2 border-b",
          isDark ? "border-slate-600" : "border-slate-100"
        )}>
          <span className={clsx(
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            Total
          </span>
          {isEditing ? (
            <div>
              <input
                {...register("total")}
                type="number"
                step="0.01"
                min="0"
                className={clsx(
                  "w-32 px-2 py-1 text-sm border rounded",
                  isDark 
                    ? "border-slate-600 bg-slate-700 text-white" 
                    : "border-slate-300"
                )}
                placeholder="Amount"
              />
            </div>
          ) : (
            <span className={clsx(
              "font-medium text-right",
              isDark ? "text-white" : "text-slate-900"
            )}>
              {formatCurrency(request.total)}
            </span>
          )}
        </div>
      </div>

      {/* Notes (Editable) */}
      {isEditing && (
        <div className="mt-4">
          <label className={clsx(
            "block text-sm font-medium mb-1",
            isDark ? "text-slate-300" : "text-slate-700"
          )}>
            Notes
          </label>
          <textarea
            {...register("notes")}
            rows={2}
            className={clsx(
              "w-full px-3 py-2 text-sm border rounded",
              isDark 
                ? "border-slate-600 bg-slate-700 text-white" 
                : "border-slate-300"
            )}
            placeholder="Add notes about this service request..."
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className={clsx(
        "mt-4 flex gap-2 pt-4 border-t",
        isDark ? "border-slate-700" : "border-slate-100"
      )}>
        {isEditing ? (
          <>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircle size={16} />
              )}
              {isSubmitting ? "Saving..." : "Save"}
            </button>
            <button 
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50",
                isDark 
                  ? "text-slate-400 hover:bg-slate-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Ban size={16} />
              Cancel
            </button>
          </>
        ) : (
          <>
            <button 
              type="button" 
              onClick={() => onViewDetails(request)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                isDark 
                  ? "text-blue-400 hover:bg-slate-700" 
                  : "text-blue-600 hover:bg-blue-50"
              )}
            >
              <Eye size={16} />
              View Details
            </button>
            
            {/* Add View Report button - only show if onViewReport is provided */}
            {onViewReport && (
              <button 
                type="button" 
                onClick={() => onViewReport(request)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  isDark 
                    ? "text-purple-400 hover:bg-slate-700" 
                    : "text-purple-600 hover:bg-purple-50"
                )}
              >
                <Notebook size={16} /> {/* Using Notebook icon for report */}
                View Report
              </button>
            )}
            
            <button 
              type="button"
              onClick={handleEditClick}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                isDark 
                  ? "text-slate-400 hover:bg-slate-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Edit size={16} />
              Edit
            </button>
            <button 
              type="button" 
              onClick={() => onDelete(request.id)} 
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ml-auto",
                isDark 
                  ? "text-red-400 hover:bg-slate-700" 
                  : "text-red-600 hover:bg-red-50"
              )}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </>
        )}
      </div>
    </form>
  );
};

export default ServiceRequestCard;
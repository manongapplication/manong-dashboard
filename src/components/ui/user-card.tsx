import { useState } from "react";
import { MoreVertical, Eye, Edit, Trash2, CheckCircle, Ban, User } from "lucide-react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import type { AppUser } from "@/types";
import type { UpdateUserForm } from "@/pages/UsersPage";

interface UserCardProps {
  user: AppUser;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: UpdateUserForm) => Promise<void>;
  onViewDocument: (documentType: string, documentUrl: string) => void;
  isDark?: boolean;
}

const UserCard = ({
  user,
  isSelected,
  onToggleSelect,
  onDelete,
  onUpdate,
  onViewDocument,
  isDark,
}: UserCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateUserForm>();

  const handleEditClick = () => {
    setIsEditing(true);
    reset({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      addressLine: user.addressLine || '',
      status: user.status || 'pending',
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const onSubmit = async (data: UpdateUserForm) => {
    await onUpdate(user.id, data);
    setIsEditing(false);
    reset();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "onHold":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "verified":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "suspended":
      case "inactive":
        return "bg-violet-100 text-violet-700 border-violet-200";
      case "deleted":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getFullName = (user: AppUser) => {
    if (user?.firstName == null || user?.lastName == null) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.nickname || user.firstName || user.lastName || "N/A";
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx(
        "border border-slate-200 rounded-lg p-5 hover:shadow-md transition-all hover:border-blue-200",
        user.status === 'deleted' && "bg-red-200"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(user.id)}
          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
        />

        {/* Avatar and Name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {user.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={getFullName(user)}
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="bg-gradient-primary w-10 h-10 rounded-full flex items-center justify-center">
              <User color="white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <input
                    {...register("firstName")}
                    type="text"
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                    placeholder="First Name"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <input
                    {...register("lastName")}
                    type="text"
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                    placeholder="Last Name"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-semibold truncate">{getFullName(user)}</h3>
                <p className="text-sm text-slate-500">{user.phone}</p>
              </>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
            user.status
          )}`}
        >
          {formatStatus(user.status)}
        </span>

        {/* Actions Menu */}
        <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Details Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b md:col-span-2")}>
          <span className="text-slate-500">Address</span>
          {isEditing ? (
            <div className="flex-1 ml-4">
              <input
                {...register("addressLine")}
                type="text"
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                placeholder="Address"
              />
            </div>
          ) : (
            <span className="font-medium text-right">{user.addressLine || "N/A"}</span>
          )}
        </div>
        
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b md:col-span-2")}>
          <span className="text-slate-500">Status</span>
          {isEditing ? (
            <div>
              <select
                {...register("status", { required: "Status is required" })}
                className="select text-sm border border-slate-300 rounded"
              >
                <option value="pending">Pending</option>
                <option value="onHold">On Hold</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
              {errors.status && (
                <p className="text-xs text-red-600 mt-1">{errors.status.message}</p>
              )}
            </div>
          ) : (
            <span className="font-medium text-right">{user.status || "N/A"}</span>
          )}
        </div>
        
        {user.providerVerifications?.map((p, index) => (
          <div 
            key={p.id} 
            className={clsx(
              index === ((user.providerVerifications?.length ?? 0)-1) ? "" : isDark ? "border-b border-slate-600" : "border-b border-slate-100", 
              "flex justify-between py-2 md:col-span-2"
            )}
          >
            <span className="text-slate-500">{p.documentType}</span>
            <span className="font-medium text-right">
              <button 
                type="button"
                onClick={() => onViewDocument(p.documentType, p.documentUrl)}
                className="text-blue-600 hover:underline"
              >
                Show
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className={clsx(isDark ? "border-slate-700" : "border-slate-100", "mt-4 flex gap-2 pt-4 border-t")}>
        {isEditing ? (
          <>
            <button 
              type="submit"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <CheckCircle size={16} />
              Save
            </button>
            <button 
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Ban size={16} />
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Eye size={16} />
              View
            </button>
            <button 
              type="button"
              onClick={handleEditClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Edit size={16} />
              Edit
            </button>
            <button 
              type="button" 
              onClick={() => onDelete(user.id)} 
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
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

export default UserCard;
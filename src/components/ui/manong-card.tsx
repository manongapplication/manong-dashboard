import { useState } from "react";
import { MoreVertical, Eye, Edit, Trash2, CheckCircle, Ban, User } from "lucide-react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import type { Manong, ManongProfile, AppUser } from "@/types";

interface UpdateManongForm {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  status: string;
  yearsExperience: number;
  experienceDescription: string;
}

interface ManongCardProps {
  manong: Manong;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: UpdateManongForm) => Promise<void>;
  onViewDocument: (documentType: string, documentUrl: string) => void;
  isExpanded: boolean;
  toggleExpand: () => void;
  isDark?: boolean;
}

const ManongCard = ({
  manong,
  isSelected,
  onToggleSelect,
  onDelete,
  onUpdate,
  onViewDocument,
  isExpanded,
  toggleExpand,
  isDark,
}: ManongCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateManongForm>();

  const handleEditClick = () => {
    setIsEditing(true);
    reset({
      firstName: manong.user.firstName || '',
      lastName: manong.user.lastName || '',
      phone: manong.user.phone || '',
      addressLine: manong.user.addressLine || '',
      status: manong.user.status || 'pending',
      yearsExperience: manong.manongProfile.yearsExperience || 0,
      experienceDescription: manong.manongProfile.experienceDescription || '',
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const onSubmit = async (data: UpdateManongForm) => {
    await onUpdate(manong.id, data);
    setIsEditing(false);
    reset();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700 border-green-200";
      case "busy":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "offline":
        return "bg-slate-100 text-slate-700 border-slate-200";
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

  const getSpecialities = (manongProfile: ManongProfile) => {
    const list = manongProfile.manongSpecialities || [];

    if (list.length === 0) return "No specialities";

    const titles = list.map(s => s.subServiceItem.title);

    if (isExpanded) {
      return (
        <>
          {titles.join(", ")}{" "}
          <button
            onClick={toggleExpand}
            className="text-blue-600 hover:underline text-sm cursor-pointer"
          >
            show less
          </button>
        </>
      );
    }

    const visible = titles.slice(0, 5);
    const hiddenCount = titles.length - 5;

    if (hiddenCount > 0) {
      return (
        <>
          {visible.join(", ")}{" "}
          <button
            onClick={toggleExpand}
            className="text-blue-600 hover:underline text-sm cursor-pointer"
          >
            (+{hiddenCount} more)
          </button>
        </>
      );
    }

    return visible.join(", ");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx(
        "border border-slate-200 rounded-lg p-5 hover:shadow-md transition-all hover:border-blue-200",
        manong.user.status === 'deleted' && "bg-red-200"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(manong.id)}
          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
        />

        {/* Avatar and Name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {manong.user?.profilePhoto ? (
            <img
              src={manong.user?.profilePhoto}
              alt={getFullName(manong.user)}
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
                    {...register("firstName", { required: "First name is required" })}
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
                    {...register("lastName", { required: "Last name is required" })}
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
                <h3 className="font-semibold truncate">{getFullName(manong.user)}</h3>
                <p className="text-sm text-slate-500">{manong.user?.phone}</p>
              </>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
            manong.manongProfile.status
          )}`}
        >
          {formatStatus(manong.manongProfile.status)}
        </span>

        {/* Actions Menu */}
        <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Details Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
          <span className="text-slate-500">Specialities</span>
          <div className="p-4 rounded-lg shadow">
            <p className="text-sm text-start">
              {getSpecialities(manong.manongProfile)}
            </p>
          </div>
        </div>
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
          <span className="text-slate-500">Experience</span>
          {isEditing ? (
            <div>
              <input
                {...register("yearsExperience", { 
                  required: "Experience is required",
                  min: { value: 0, message: "Experience must be positive" }
                })}
                type="number"
                className="px-2 py-1 text-sm border border-slate-300 rounded w-24"
                placeholder="Years"
              />
              {errors.yearsExperience && (
                <p className="text-xs text-red-600 mt-1">{errors.yearsExperience.message}</p>
              )}
            </div>
          ) : (
            <span className="font-medium">{manong.manongProfile.yearsExperience || 0} years</span>
          )}
        </div>
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
          <span className="text-slate-500">Assistants</span>
          <span className="font-medium">{manong.manongProfile.manongAssistants?.length || 0}</span>
        </div>
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
          <span className="text-slate-500">Verified</span>
          <span className="font-medium text-right">{manong.manongProfile.isProfessionallyVerified ? "Yes" : "No"}</span>
        </div>
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
            <span className="font-medium text-right">{manong.user?.addressLine || "N/A"}</span>
          )}
        </div>
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b md:col-span-2")}>
          <span className="text-slate-500">Description</span>
          {isEditing ? (
            <div className="flex-1 ml-4">
              <textarea
                {...register("experienceDescription")}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                placeholder="Description"
                rows={2}
              />
            </div>
          ) : (
            <span className="font-medium text-right">{manong.manongProfile.experienceDescription || "N/A"}</span>
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
            <span className="font-medium text-right">{manong.user?.status || "N/A"}</span>
          )}
        </div>
        {manong.providerVerifications?.map((p, index) => (
          <div key={p.id} className={clsx(index == ((manong.providerVerifications?.length ?? 0)-1) ? "" : isDark ? "border-b border-slate-600" : "border-b border-slate-100", "flex justify-between py-2 md:col-span-2")}>
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
              onClick={() => onDelete(manong.id)} 
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

export default ManongCard;
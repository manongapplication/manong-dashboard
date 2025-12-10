import { useState } from "react";
import { 
  MoreVertical, 
  Eye, 
  Trash2, 
  CheckCircle, 
  Ban, 
  Smartphone,
  ExternalLink,
  Users
} from "lucide-react";
import clsx from "clsx";
import type { AppVersion } from "@/pages/AppVersionsPage";

interface AppVersionCardProps {
  version: AppVersion;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onViewDetails: (version: AppVersion) => void;
  isDark?: boolean;
}

const AppVersionCard = ({
  version,
  isSelected,
  onToggleSelect,
  onDelete,
  onViewDetails,
  isDark,
}: AppVersionCardProps) => {
  const [showActions, setShowActions] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "NORMAL":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPlatformColor = (platform: string) => {
    return platform === "ANDROID" 
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-gray-100 text-gray-700 border-gray-200";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openStoreUrl = () => {
    const url = version.platform === "ANDROID" 
      ? (version.androidStoreUrl || 'market://details?id=com.yourapp')
      : (version.iosStoreUrl || 'https://apps.apple.com/app/idYOUR_APP_ID');
    
    window.open(url, '_blank');
  };

  return (
    <div className={clsx(
      "border border-slate-200 rounded-lg p-5 hover:shadow-md transition-all",
      !version.isActive && "opacity-60 bg-gray-50",
      version.priority === "CRITICAL" && "border-red-200 hover:border-red-300",
      version.priority === "HIGH" && "border-orange-200 hover:border-orange-300",
    )}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(version.id)}
          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
        />

        {/* Platform and Version */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getPlatformColor(version.platform)}`}>
            <Smartphone size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">
                {version.platform} v{version.version}
              </h3>
              {!version.isActive && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                  Inactive
                </span>
              )}
              {version.isMandatory && (
                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                  Mandatory
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Build {version.buildNumber} • Released {formatDate(version.releaseDate)}
            </p>
            {version.whatsNew && (
              <p className="text-sm text-slate-600 mt-1 truncate">
                {version.whatsNew}
              </p>
            )}
          </div>
        </div>

        {/* Priority Badge */}
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(version.priority)}`}
        >
          {version.priority}
        </span>

        {/* Actions Menu */}
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setShowActions(!showActions)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <MoreVertical size={20} />
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
              <button
                onClick={() => {
                  onViewDetails(version);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Eye size={16} />
                View Details
              </button>
              <button
                onClick={openStoreUrl}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Open in Store
              </button>
              <button
                onClick={() => {
                  onDelete(version.id);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Deactivate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-sm">
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
          <span className="text-slate-500">Status</span>
          <span className="font-medium text-right flex items-center gap-1">
            {version.isActive ? (
              <>
                <CheckCircle size={14} className="text-green-500" />
                Active
              </>
            ) : (
              <>
                <Ban size={14} className="text-gray-500" />
                Inactive
              </>
            )}
          </span>
        </div>
        
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
          <span className="text-slate-500">Mandatory</span>
          <span className="font-medium text-right">
            {version.isMandatory ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
          <span className="text-slate-500">Min Version</span>
          <span className="font-medium text-right">
            {version.minVersion || 'None'}
          </span>
        </div>
        
        <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
          <span className="text-slate-500">Force Update</span>
          <span className="font-medium text-right">
            {version.forceUpdateDate ? formatDate(version.forceUpdateDate) : 'None'}
          </span>
        </div>
        
        {version.userStats && (
          <>
            <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
              <span className="text-slate-500 flex items-center gap-1">
                <Users size={14} />
                Total Users
              </span>
              <span className="font-medium text-right">
                {version.userStats.totalUsers.toLocaleString()}
              </span>
            </div>
            
            <div className={clsx(isDark ? "border-slate-600" : "border-slate-100", "flex justify-between py-2 border-b")}>
              <span className="text-slate-500">Active (7d)</span>
              <span className="font-medium text-right">
                {version.userStats.activeUsersLast7Days.toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className={clsx(isDark ? "border-slate-700" : "border-slate-100", "mt-4 flex gap-2 pt-4 border-t")}>
        <button 
          type="button"
          onClick={() => onViewDetails(version)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye size={16} />
          View Details
        </button>
        
        <button 
          type="button"
          onClick={openStoreUrl}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ExternalLink size={16} />
          Open in Store
        </button>
        
        <button 
          type="button" 
          onClick={() => onDelete(version.id)} 
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
        >
          <Trash2 size={16} />
          Deactivate
        </button>
      </div>
    </div>
  );
};

export default AppVersionCard;
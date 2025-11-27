import { useState } from "react";
import { Copy, Users, User, Smartphone, Calendar, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import type { ReferralCode } from "@/types/referral-code";

interface ReferralCodeCardProps {
  code: ReferralCode;
  onCopyCode: (code: string) => void;
  onEdit: (code: ReferralCode) => void;
  onDelete: (code: ReferralCode) => void;
}

const ReferralCodeCard: React.FC<ReferralCodeCardProps> = ({ 
  code, 
  onCopyCode,
  onEdit,
  onDelete
}) => {
  const [showUsageDetails, setShowUsageDetails] = useState(false);
  const [showAllUsages, setShowAllUsages] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUsageStats = () => {
    const totalUsages = code.usages?.length || 0;
    const registeredUsers = new Set(code.usages?.map(usage => usage.userId).filter(Boolean)).size;
    const uniqueDevices = new Set(code.usages?.map(usage => usage.deviceId)).size;
    
    return { totalUsages, registeredUsers, uniqueDevices };
  };

  const getUsageBadgeColor = (count: number) => {
    if (count === 0) return 'text-gray-600 dark:text-gray-400 border border-gray-700';
    if (count <= 2) return 'text-blue-600 dark:text-blue-400 border border-gray-700';
    if (count <= 5) return 'text-green-600 dark:text-green-400 border border-gray-700';
    return 'text-purple-600 dark:text-purple-400 border border-gray-700';
  };

  const { totalUsages, registeredUsers, uniqueDevices } = getUsageStats();

  const displayedUsages = showAllUsages 
    ? code.usages 
    : (code.usages?.slice(0, 3) || []);

  return (
    <div className="rounded-lg shadow-sm p-6 border border-gray-700 hover:shadow-md transition-shadow w-full">
      {/* Header with Actions */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{code.code}</h3>
            <button
              onClick={() => onCopyCode(code.code)}
              className="cursor-pointer p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Copy code"
            >
              <Copy size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">ID: #{code.id}</p>
        </div>
        <div className="text-right">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageBadgeColor(totalUsages)}`}>
            {totalUsages} uses
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(code.createdAt)}
          </p>
          
          {/* Action Buttons */}
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => onEdit(code)}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Edit code"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete(code)}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete code"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      {code.owner && (
        <div className="mb-3 p-2 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Owner</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium">{code.owner.firstName} {code.owner.lastName}</span>
            <span className="text-gray-500 dark:text-gray-400">•</span>
            <span>{code.owner.phone}</span>
            {code.owner.email && (
              <>
                <span className="text-gray-500 dark:text-gray-400">•</span>
                <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                  {code.owner.email}
                </span>
              </>
            )}
            <span className="text-gray-500 dark:text-gray-400">•</span>
            <span className="capitalize px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
              {code.owner.role.toLowerCase()}
            </span>
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 border border-gray-700 rounded">
            <Users size={16} className="mx-auto text-blue-600 dark:text-blue-400 mb-1" />
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">{totalUsages}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="p-2 border border-gray-700 rounded">
            <User size={16} className="mx-auto text-green-600 dark:text-green-400 mb-1" />
            <div className="text-sm font-semibold text-green-600 dark:text-green-400">{registeredUsers}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Users</div>
          </div>
          <div className="p-2 border border-gray-700 rounded">
            <Smartphone size={16} className="mx-auto text-purple-600 dark:text-purple-400 mb-1" />
            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">{uniqueDevices}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Devices</div>
          </div>
        </div>
      </div>

      {/* Usage Details Toggle */}
      {totalUsages > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <button
            onClick={() => setShowUsageDetails(!showUsageDetails)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <span>Usage Details</span>
            {showUsageDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showUsageDetails && (
            <div className="mt-3 space-y-2">
              {/* Usage List */}
              {displayedUsages?.map((usage) => (
                <div key={usage.id} className="flex items-center justify-between p-2 border border-gray-700 rounded text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Smartphone size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {usage.deviceId.substring(0, 6)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(usage.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {usage.user ? (
                      <span className="text-green-600 dark:text-green-400 text-xs font-medium">Registered</span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400 text-xs">Guest</span>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(usage.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Show More/Less Toggle */}
              {(code.usages?.length || 0) > 3 && (
                <button
                  onClick={() => setShowAllUsages(!showAllUsages)}
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-1"
                >
                  {showAllUsages ? 'Show Less' : `Show ${(code.usages?.length || 0) - 3} More`}
                </button>
              )}

              {/* Usage Summary */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-700">
                First used: {code.usages && code.usages.length > 0 
                  ? formatDate(code.usages[code.usages.length - 1].createdAt)
                  : 'Never'
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Usages State */}
      {totalUsages === 0 && (
        <div className="text-center py-4 border-t border-gray-700">
          <Users size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No usages yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">This code hasn't been used by anyone</p>
        </div>
      )}
    </div>
  );
};

export default ReferralCodeCard;
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { UrgencyLevelsForm } from "@/pages/UrgencyLevelsPage";
import type { UrgencyLevel } from "@/types";

interface UrgencyLevelCardProps {
  urgencyLevel: UrgencyLevel;
  isEditing?: boolean;
  onUpdate: (id: number, data: Partial<UrgencyLevel>) => void;
}

const UrgencyLevelCard: React.FC<UrgencyLevelCardProps> = ({ 
  urgencyLevel, 
  isEditing, 
  onUpdate 
}) => {
  const [localData, setLocalData] = useState<Partial<UrgencyLevel>>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset // Add reset function
  } = useForm<UrgencyLevelsForm>();

  // Reset form when urgencyLevel changes or when entering/exiting edit mode
  useEffect(() => {
    reset({
      level: urgencyLevel.level,
      time: urgencyLevel.time || '',
      price: urgencyLevel.price?.toString() || '',
    });
  }, [urgencyLevel, reset, isEditing]); // Added isEditing to dependencies

  // Watch for form changes
  const watchedFields = watch();

  useEffect(() => {
    if (isEditing) {
      const updatedData: Partial<UrgencyLevel> = {};
      let hasChanges = false;

      if (watchedFields.level !== urgencyLevel.level) {
        updatedData.level = watchedFields.level;
        hasChanges = true;
      }

      if (watchedFields.time !== (urgencyLevel.time || '')) {
        updatedData.time = watchedFields.time || null;
        hasChanges = true;
      }

      if (watchedFields.price !== (urgencyLevel.price?.toString() || '')) {
        updatedData.price = watchedFields.price ? parseFloat(watchedFields.price) : null;
        hasChanges = true;
      }

      if (hasChanges) {
        setLocalData(updatedData);
        onUpdate(urgencyLevel.id!, updatedData);
      }
    }
  }, [watchedFields, isEditing, urgencyLevel, onUpdate]);

  const onSubmit = (data: UrgencyLevelsForm) => {
    const formattedData: Partial<UrgencyLevel> = {
      level: data.level,
      time: data.time || null,
      price: data.price ? parseFloat(data.price) : null,
    };
    
    onUpdate(urgencyLevel.id!, formattedData);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl shadow-md p-5 flex flex-col gap-4 border border-gray-200 hover:shadow-lg transition-shadow">
      {isEditing ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Level Name
            </label>
            <input 
              {...register('level', { 
                required: 'Level is required!',
                minLength: { value: 1, message: 'Level cannot be empty' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter level name"
            />
            {errors.level && (
              <p className="text-red-500 text-xs mt-1">{errors.level.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Time
            </label>
            <input 
              {...register('time')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 24 hours"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Price (₱)
            </label>
            <input 
              type="number"
              step="0.01"
              {...register('price')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
            )}
          </div>

          {Object.keys(localData).length > 0 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              Unsaved changes
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold">{urgencyLevel.level}</h2>
          <p className="text-sm">{urgencyLevel.time || 'No time specified'}</p>
          <p className="text-base font-bold">
            ₱ {urgencyLevel.price?.toLocaleString() ?? "—"}
          </p>
        </>
      )}
    </form>
  );
};

export default UrgencyLevelCard;
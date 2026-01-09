import type { SubServiceItem } from "@/types";
import { getIconComponent } from "@/utils/icon-map";
import clsx from "clsx";
import { Undo, X, Edit2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SubServiceItemCardProps {
  subServiceItem: SubServiceItem;
  isEditing?: boolean;
  onClickCard: (id: number) => void;
  onDelete: (id: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChangeSubValue: (id: number, key: string, value: any) => void,
}

const SubServiceItemCard: React.FC<SubServiceItemCardProps> = ({ 
  subServiceItem, 
  isEditing, 
  onClickCard, 
  onDelete, 
  onChangeSubValue 
}) => {
  const Icon = getIconComponent(subServiceItem.iconName ?? '');
  const DeleteIcon = subServiceItem.markAsDelete ? Undo : X;
  
  // State for description editing
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(subServiceItem.description || '');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const handleDescriptionSave = () => {
    onChangeSubValue(subServiceItem.id, 'description', tempDescription);
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(subServiceItem.description || '');
    setIsEditingDescription(false);
  };

  const toggleDescriptionExpanded = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const hasDescription = subServiceItem.description && subServiceItem.description.trim().length > 0;

  return (
    <label className={clsx(subServiceItem.markAsDelete && "bg-red-200", "block cursor-pointer mb-2")}>
      <div onClick={() => onClickCard(subServiceItem.id)} className={clsx(localStorage.getItem("theme") == 'dark' ? "border-slate-700" : "border-slate-300", !subServiceItem.markAsDelete && "flex flex-col peer-checked:border-[#034B57] peer-checked:bg-[#04697D] hover:border-[#04697D]", "border rounded-lg p-3 sm:p-4 transition-all gap-2")}>
        <input type="radio" name="subServices" value="2" className="peer hidden" />
        
        {/* Title Row with Delete Button */}
        <div className="flex flex-row items-center gap-2">
          <div className="text-sm sm:text-base">
            <Icon className="w-5 h-5" />
          </div>
          {isEditing ? (
            <input
              type="text"
              className="input flex flex-1"
              value={subServiceItem.title}
              onChange={(e) => onChangeSubValue(subServiceItem.id, 'title', e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
              }}
              disabled={subServiceItem.markAsDelete}
            />
          ) : (
            <p className="text-xs sm:text-sm">{subServiceItem.title}</p>
          )}
          {isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(subServiceItem.id);
              }}
              className="text-gray-400 hover:text-red-500 cursor-pointer transition"
            >
              <DeleteIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Description Section */}
        {(hasDescription || isEditing) && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500 font-medium">Description:</label>
              {isEditing && (
                <div className="flex items-center gap-1">
                  {!isEditingDescription ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingDescription(true);
                      }}
                      className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDescriptionSave();
                        }}
                        className="text-xs text-green-500 hover:text-green-700 flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDescriptionCancel();
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <Undo className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {isEditing && isEditingDescription ? (
              <textarea
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full min-h-[80px] p-2 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter description for this sub-service..."
                autoFocus
              />
            ) : (
              <div>
                {hasDescription && (
                  <div>
                    <p 
                      className={`text-xs text-gray-600 ${!isDescriptionExpanded && 'line-clamp-2'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDescriptionExpanded();
                      }}
                    >
                      {subServiceItem.description}
                    </p>
                    {subServiceItem.description && subServiceItem.description.length > 100 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDescriptionExpanded();
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 mt-1 flex items-center gap-1"
                      >
                        {isDescriptionExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Show More
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
                {isEditing && !hasDescription && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingDescription(true);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded p-2 w-full text-center"
                  >
                    + Add Description
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cost Section */}
        <div className="flex flex-row gap-2 items-center mt-2">
          <label className="text-xs text-gray-500 font-medium">Cost:</label>
          {isEditing ? (
            <input
              type="number"
              value={subServiceItem.cost ?? 0}
              className="input w-20"
              onChange={(e) => onChangeSubValue(subServiceItem.id, 'cost', Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              disabled={subServiceItem.markAsDelete}
            />
          ) : (
            <p className="text-sm font-medium">${subServiceItem.cost?.toLocaleString()}</p>
          )}
        </div>
      </div>
    </label>
  );
}

export default SubServiceItemCard;
import type { SubServiceItem } from "@/types";
import { getIconComponent } from "@/utils/icon-map";
import clsx from "clsx";
import { Undo, X, Edit2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SubServiceItemCardProps {
  subServiceItem: SubServiceItem;
  isEditing?: boolean;
  onClickCard: (id: number) => void;
  onDelete: (id: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChangeSubValue: (id: number, key: string, value: any) => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDescriptionSave = () => {
    onChangeSubValue(subServiceItem.id, 'description', tempDescription);
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(subServiceItem.description || '');
    setIsEditingDescription(false);
  };

  const toggleDescriptionExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingDescription(true);
  };

  const hasDescription = subServiceItem.description && subServiceItem.description.trim().length > 0;
  const descriptionText = subServiceItem.description || '';
  const shouldShowToggle = descriptionText.length > 100;

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditingDescription && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditingDescription]);

  // Close editing when clicking outside (for better UX)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditingDescription && textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        handleDescriptionSave();
      }
    };

    if (isEditingDescription) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingDescription]);

  return (
    <div className={clsx(subServiceItem.markAsDelete && "bg-red-200", "block mb-2")}>
      <div 
        onClick={() => onClickCard(subServiceItem.id)} 
        className={clsx(
          localStorage.getItem("theme") == 'dark' ? "border-slate-700" : "border-slate-300",
          !subServiceItem.markAsDelete && "flex flex-col peer-checked:border-[#034B57] peer-checked:bg-[#04697D] hover:border-[#04697D]",
          "border rounded-lg p-3 sm:p-4 transition-all gap-2 cursor-pointer"
        )}
      >
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
              onClick={(e) => e.stopPropagation()}
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
              className="text-gray-400 hover:text-red-500 cursor-pointer transition ml-auto"
            >
              <DeleteIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Description Section */}
        {(hasDescription || isEditing) && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500 font-medium">Description:</label>
              {isEditing && !isEditingDescription && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  {hasDescription ? "Edit" : "Add"}
                </button>
              )}
            </div>
            
            {isEditing && isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  ref={textareaRef}
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className="w-full min-h-[80px] p-2 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter description for this sub-service..."
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDescriptionSave}
                    className="text-xs bg-green-500 text-white hover:bg-green-600 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleDescriptionCancel}
                    className="text-xs bg-gray-300 text-gray-700 hover:bg-gray-400 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Undo className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {hasDescription ? (
                  <div>
                    <p 
                      className={`text-xs text-gray-600 ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}
                    >
                      {descriptionText}
                    </p>
                    {shouldShowToggle && (
                      <button
                        type="button"
                        onClick={toggleDescriptionExpanded}
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
                ) : (
                  isEditing && (
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded p-2 w-full text-center bg-transparent cursor-pointer"
                    >
                      + Add Description
                    </button>
                  )
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
    </div>
  );
};

export default SubServiceItemCard;
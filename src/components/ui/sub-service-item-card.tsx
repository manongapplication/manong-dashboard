import type { SubServiceItem } from "@/types";
import { getIconComponent } from "@/utils/icon-map";
import clsx from "clsx";
import { Undo, X } from "lucide-react";

interface SubServiceItemCardProps {
  subServiceItem: SubServiceItem;
  isEditing?: boolean;
  onClickCard: (id: number) => void;
  onDelete: (id: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChangeSubValue: (id: number, key: string, value: any) => void,
}

const SubServiceItemCard: React.FC<SubServiceItemCardProps> = ({ subServiceItem, isEditing, onClickCard, onDelete, onChangeSubValue }) => {
  const Icon = getIconComponent(subServiceItem.iconName ?? '');
   const DeleteIcon = subServiceItem.markAsDelete ? Undo : X;
  
  return (
    <label className={clsx(subServiceItem.markAsDelete && "bg-red-200", "block cursor-pointer mb-2")}>
      <div onClick={() => onClickCard(subServiceItem.id)} className={clsx(localStorage.getItem("theme") == 'dark' ? "border-slate-700" : "border-slate-300", !subServiceItem.markAsDelete && "flex flex-col peer-checked:border-[#034B57] peer-checked:bg-[#04697D] hover:border-[#04697D]", "border rounded-lg p-3 sm:p-4 transition-all gap-2")}>
        <input type="radio" name="subServices" value="2" className="peer hidden" />
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
              className=" text-gray-400 hover:text-red-500 cursor-pointer transition"
            >
              <DeleteIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-row gap-2 items-center">
          <label>Cost</label>
          {isEditing ? (
            <input
              type="number"
              value={subServiceItem.cost ?? 0}
              className="input w-20"
              onChange={(e) => onChangeSubValue(subServiceItem.id, 'cost', Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p>{subServiceItem.cost}</p>
          )}
        </div>
      </div>
    </label>
  );
}

export default SubServiceItemCard;
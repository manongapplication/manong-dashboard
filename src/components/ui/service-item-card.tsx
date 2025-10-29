import type { ServicePageForm } from "@/pages/ServicesPage";
import type { ServiceItem } from "@/types"
import { getIconComponent } from "@/utils/icon-map";
import { Undo, X } from "lucide-react";
import type { useForm } from "react-hook-form";

interface ServiceItemCardProps {
  serviceItem: ServiceItem;
  isEditing: boolean;
  form: ReturnType<typeof useForm<ServicePageForm>>;
  index: number;
  onClickCard: (id: number) => void,
  onDelete: (id: number) => void,
}

const ServiceItemCard: React.FC<ServiceItemCardProps> = ({ serviceItem, isEditing, form, index, onClickCard, onDelete }) => {
  const Icon = getIconComponent(serviceItem.iconName ?? '');
  const DeleteIcon = serviceItem.markDelete ? Undo : X;
  
  const { register } = form;
  return (
    <div className="relative block cursor-pointer">
      {isEditing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(serviceItem.id);
          }}
          className="absolute top-1 right-1 text-gray-400 hover:text-red-500 cursor-pointer transition"
        >
          <DeleteIcon className="w-4 h-4" />
        </button>
      )}
      <div className="flex flex-col gap-1 sm:gap-2 items-center">
        <input
          type="radio"
          name="services"
          value="1"
          className="peer hidden"
        />
        <div
          style={{ backgroundColor: serviceItem.iconColor }}
          onClick={(e) => {
            e.stopPropagation();
            onClickCard(serviceItem.id);
          }}
          className="border rounded-2xl p-3 sm:p-4 text-center transition-all peer-checked:border-[#034B57] peer-checked:bg-[#04697D] hover:border-[#04697D] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center text-sm sm:text-base"
        >
          <Icon className="w-5 h-5"  style={{ color: serviceItem?.iconTextColor }} />
        </div>
        {isEditing ? (
          <input
            {...register(`services.${index}.title` as const)}
            defaultValue={serviceItem.title}
            type="text" 
            className="input text-center" 
            placeholder="Service Name" 
            disabled={serviceItem.markDelete}
          />
        ) : (
          <p 
            className="text-center text-xs sm:text-sm"
          >
            {serviceItem.title}
          </p>
        )}
      </div>
    </div>
  )
}

export default ServiceItemCard;
import AlertDialog from "@/components/ui/alert-dialog";
import ServiceItemCard from "@/components/ui/service-item-card";
import type { ServiceItem } from "@/types";
import { ServiceItemStatus } from "@/types/service-item-status";
import axios from "axios";
import clsx from "clsx";
import { PlusSquare, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useForm } from "react-hook-form";
import IconifyPicker from "@zunicornshift/mui-iconify-picker";
import { getIconComponent } from "@/utils/icon-map";
import CreatableSelect from 'react-select/creatable';
import { colorOptions, type ColorOption } from "@/utils/color-utils";
import ColorInput from "@/components/ui/color-input";

export interface ServicePageForm {
  services: {
    title: string;
    iconName: string;
    iconColor: string;
    iconTextColor: string;
    markDelete?: boolean;
    markColorEditing?: boolean;
  }[];
}

const ServicesPage: React.FC = () => {
  const [ oldServicesItem, setOldServicesItem ] = useState<ServiceItem[]>();
  const [ servicesItem, setServicesItem ] = useState<ServiceItem[]>();
  const [ isEditing, setIsEditing ] = useState(false);
  const [ selectedId, setSelectedId ] = useState(-1);
  const [ deletedId, setDeletedId ] = useState(-1);
  const [ hasChanges, setHasChanges ] = useState(false);
  const [ showColorPicker, setShowColorPicker ] = useState(false);
  const [ isConfirmDialogOpen, setConfirmDialogOpen ] = useState(false);
  const [ selectedColorInput, setSelectedColorInput ] = useState('iconColor');

  const form = useForm<ServicePageForm>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const fetchServices = async () => {
    const response = await axios.get(`http://localhost:3000/api/service-items`);

    if (response.data.success) {
      const data = response.data.data;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizedData = data.map((item: any) => {
        const validStatuses = Object.values(ServiceItemStatus);
        const status = validStatuses.includes(item.status) ? item.status : ServiceItemStatus.Inactive;
        return {
          id: item.id,
          title: item.title,
          description: item.title,
          priceMin: item.title,
          priceMax: item.priceMax,
          ratePerKm: item.ratePerKm,
          iconName: item.iconName,
          iconColor: item.iconColor,
          iconTextColor: item.iconTextColor,
          status: status,
          subServiceItems: item.subServiceItems,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      });

      setServicesItem(normalizedData);
      setOldServicesItem(normalizedData);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddServiceItem = () => {
    setIsEditing(true);
    const newItem: ServiceItem = {
      id: (servicesItem?.length ?? 0) + 1,
      title: "Test",
      description: "Test",
      priceMin: 0,
      priceMax: 0,
      ratePerKm: 0,
      iconColor: "",
      iconTextColor: "",
      status: "active",
      subServiceItems: []
    };
    setServicesItem((prev) => [...(prev || []), newItem]);
  }

  const resetData = () => {
    setServicesItem(oldServicesItem);
    setHasChanges(false);
    setValue(`services.${selectedId}.iconColor`, oldServicesItem![selectedId-1].iconColor);
    setShowColorPicker(false);
  }

  useEffect(() => {
    if (servicesItem !== oldServicesItem) {
      setHasChanges(true);
    }
  }, [servicesItem, oldServicesItem]);

  const handleDelete = () => {
    setConfirmDialogOpen(false);
    setServicesItem(prev =>
      prev?.map((item) =>
        item.id === deletedId ? { ...item, markDelete: true, } : item,
      )
    );
  }

  const handleUndoDelete = () => {
    setServicesItem(prev =>
      prev?.map(item =>
        item.id === deletedId ? { ...item, markDelete: false } : item
      )
    );
    setSelectedId(-1);
    setDeletedId(-1);
  }

  const handleColorEditing = (id: number, clickedItem: ServiceItem) => {
    setSelectedId(id);
    setValue(`services.${id}.iconColor`, clickedItem.iconColor);
    setShowColorPicker(true);

    setServicesItem(prev =>
      prev?.map(item =>
        item.id === id ? { ...item, markColorEditing: true } : item,
      )
    );
  }

  const handleCloseHexColorPicker = () => {
    const id = selectedId;
    setShowColorPicker(false);
    setServicesItem(prev =>
      prev?.map(item =>
        item.id === id ? { ...item, markColorEditing: false } : item
      )
    );
    setSelectedId(-1);
  }

  const selectedIconName = React.useMemo(() => {
    return selectedId >= 0 && servicesItem
      ? servicesItem.find((item) => item.id === selectedId)?.iconName
      : undefined;
  }, [selectedId, servicesItem]);

  const selectedIconColor = React.useMemo(() => {
    return selectedId >= 0 && servicesItem
      ? servicesItem.find((item) => item.id === selectedId)?.iconColor
      : undefined;
  }, [selectedId, servicesItem]);

  const selectedIconTextColor = React.useMemo(() => {
    return selectedId >= 0 && servicesItem
      ? servicesItem.find((item) => item.id === selectedId)?.iconTextColor
      : undefined;
  }, [selectedId, servicesItem]);

  const selectedServiceTitle = React.useMemo(() => {
    return selectedId >= 0 && servicesItem
      ? servicesItem.find((item) => item.id === selectedId)?.title
      : undefined;
  }, [selectedId, servicesItem]);

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col gap-3 sm:gap-4">
        <label className="block mb-1 font-medium text-sm sm:text-base">
          Services Type
        </label>
        <div className="flex flex-col justify-center">
          {/* Action Buttons */}
          <div className="flex flex-row justify-end gap-2 mb-4 flex-wrap">
            {hasChanges && (
              <button 
                type="button" 
                className="btn btn-sm sm:btn-md" 
                onClick={resetData}
              >
                Reset
              </button>
            )}
            <button type="button" className={clsx("btn btn-sm sm:btn-md", isEditing && "btn bg-gray-500!")} onClick={() => setIsEditing((prev) => !prev)}>
              Edit Services
            </button>
          </div>

          {/* Color Picker Modal for Mobile */}
          {isEditing && showColorPicker && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/30 bg-opacity-50 z-40"
                onClick={handleCloseHexColorPicker}
              />
              
              {/* Modal */}
              <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:right-4 sm:top-20 sm:translate-y-0 bg-white rounded-lg shadow-xl z-50 p-4 max-w-sm mx-auto sm:mx-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Pick Color</h3>
                  <button
                    onClick={handleCloseHexColorPicker}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <HexColorPicker
                  color={selectedColorInput === 'iconColor' ? selectedIconColor : selectedIconTextColor}
                  onChange={(color) => {
                    const key = selectedColorInput;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setValue(`services.${selectedId}.${key}` as any, color);
                    
                    setServicesItem((prev) => 
                      prev
                        ? prev.map((item) =>
                          item.id === selectedId ? { ...item, [key]: color } : item,
                        )
                        : []
                    );
                  }}
                  style={{ width: '100%' }}
                />
                <div className="mt-4 flex gap-4 items-center justify-center">
                  <div className="flex flex-col gap-1 sm:gap-2 items-center">
                    <div
                      style={{ backgroundColor: selectedIconColor }}
                      className="border rounded-2xl p-3 sm:p-4 text-center transition-all peer-checked:border-[#034B57] peer-checked:bg-[#04697D] hover:border-[#04697D] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center text-sm sm:text-base"
                    >
                      {selectedIconName && (() => {
                        const Icon = getIconComponent(selectedIconName);
                        return <Icon className="w-5 h-5" style={{ color: selectedIconTextColor }} />;
                      })()}
                    </div>
                    <p 
                      className="text-center text-xs sm:text-sm"
                    >
                      {selectedServiceTitle}
                    </p>
                  </div>
                  <ColorInput
                    selectedColorInput="iconColor"
                    setSelectedColorInput={setSelectedColorInput}
                    currentValue={selectedIconColor ?? ''}
                    form={form}
                    setServicesItem={setServicesItem}
                    selectedId={selectedId}
                    className="flex-1 text-sm"
                  />
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Icon Color:</span>
                    
                    <ColorInput
                      selectedColorInput="iconTextColor"
                      setSelectedColorInput={setSelectedColorInput}
                      currentValue={selectedIconTextColor ?? ''}
                      form={form}
                      setServicesItem={setServicesItem}
                      selectedId={selectedId}
                      className="flex-1 text-sm"
                    />

                  </div>
                </div>
                <div className="mt-4 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">Selected Icon:</span>
                    <span className="text-sm text-gray-700">
                      {selectedIconName}
                    </span>
                  </div>
                  <IconifyPicker
                    value={selectedIconName}
                    onChange={(value) => {
                      // Update react-hook-form value
                      setValue(`services.${selectedId}.iconName`, value ?? '');

                      // Update your local state so the ServiceItemCard re-renders
                      setServicesItem((prev) =>
                        prev?.map((item) =>
                          item.id === selectedId ? { ...item, iconName: value ?? '' } : item
                        )
                      );
                    }}
                  />

                </div>
              </div>
            </>
          )}

          {/* Services Grid */}
          <div className="bg-gray-100 rounded-lg">
            <div 
              id="serviceTypeArea" 
              className="p-4 sm:p-8 lg:p-12 card bg-base-100 shadow-sm w-full max-w-6xl mx-auto"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {servicesItem && servicesItem.map((item, index) => 
                  <div className={clsx(item.markDelete && "bg-red-200 rounded-2xl")}>
                    <ServiceItemCard 
                      key={item.id}
                      serviceItem={item}
                      isEditing={isEditing} 
                      form={form}
                      index={index}
                      onClickCard={(id) => {
                        const clickedItem = servicesItem.find(item => item.id === id);
                        if (!clickedItem) return;

                        setSelectedId(id);
                        setValue(`services.${id}.iconColor`, clickedItem.iconColor);
                        setShowColorPicker(true);
                        
                        handleColorEditing(id, clickedItem);
                      }}
                      onDelete={(id) => {
                        const clickedItem = servicesItem.find(item => item.id === id);
                        if (!clickedItem) return;

                        if (clickedItem.markDelete) {
                          handleUndoDelete();
                          return;
                        }

                        setSelectedId(id);
                        setDeletedId(id);
                        setConfirmDialogOpen(true);
                      }}
                    />
                  </div>
                )}
                <label 
                  className="block cursor-pointer" 
                  onClick={handleAddServiceItem}
                >
                  <div className="flex flex-col gap-1 sm:gap-2 items-center">
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-2xl p-3 sm:p-4 text-center hover:border-[#04697D] transition-all w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-gray-400"
                    >
                      <PlusSquare className="w-5 h-5" />
                    </div>
                    <p className="text-center text-xs sm:text-sm text-gray-500">Add</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        isOpen={isConfirmDialogOpen}
        title="Delete Service"
        message={`Are you sure you want to delete '${servicesItem?.find(item => item.id === selectedId)?.title ?? ""}' service? You can still undo this before saving.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmDialogOpen(false);
          setDeletedId(-1);
        }}
      />
    </div>
  )
}

export default ServicesPage;
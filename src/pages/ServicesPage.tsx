import AlertDialog from "@/components/ui/alert-dialog";
import ServiceItemCard from "@/components/ui/service-item-card";
import type { ServiceItem, SubServiceItem } from "@/types";
import { ServiceItemStatus, serviceItemStatusOptions } from "@/types/service-item-status";
import axios from "axios";
import clsx from "clsx";
import { PencilIcon, PlusSquare, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { HexColorPicker } from "react-colorful";
import IconifyPicker from "@zunicornshift/mui-iconify-picker";
import { getIconComponent } from "@/utils/icon-map";
import ColorInput from "@/components/ui/color-input";
import Modal from "@/components/ui/modal";
import SubServiceItemCard from "@/components/ui/sub-service-item-card";
import { Icon } from "@iconify/react";

const ITEMS_PER_PAGE = 6;

const ServicesPage: React.FC = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ oldServicesItem, setOldServicesItem ] = useState<ServiceItem[]>();
  const [ servicesItem, setServicesItem ] = useState<ServiceItem[]>();
  const [ isEditing, setIsEditing ] = useState(false);
  const [ selectedId, setSelectedId ] = useState(-1);
  const [ deletedId, setDeletedId ] = useState(-1);
  const [ hasChanges, setHasChanges ] = useState(false);
  const [ showColorPicker, setShowColorPicker ] = useState(false);
  const [ isConfirmDialogOpen, setConfirmDialogOpen ] = useState(false);
  const [ selectedColorInput, setSelectedColorInput ] = useState('iconColor');
  const [ isModalOpen, setIsModalOpen ] = useState(false);
  const [ modalTitle, setModalTitle ] = useState('');
  const [ selectedSubServiceId, setSelectedSubServiceId ] = useState<number | null>();
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [subServiceSearchQuery, setSubServiceSearchQuery] = useState('');
  const [nonEditingSubServiceSearchQuery, setNonEditingSubServiceSearchQuery] = useState('');
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [nonEditingCurrentPage, setNonEditingCurrentPage] = useState(1);


  const fetchServices = async () => {
    const response = await axios.get(`${baseApiUrl}/service-items`);

    if (response.data.success) {
      const data = response.data.data;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizedData = data.map((item: any) => {
        const validStatuses = Object.values(ServiceItemStatus);
        const status = validStatuses.includes(item.status) ? item.status : ServiceItemStatus.Inactive;
        return {
          id: item.id,
          title: item.title,
          description: item.description ?? "",
          priceMin: Number(item.priceMin),
          priceMax: Number(item.priceMax),
          ratePerKm: Number(item.ratePerKm),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddServiceItem = () => {
    setIsEditing(true);
    const newItem: ServiceItem = {
      id: (servicesItem?.length ?? 0) + 1,
      title: "Service Name",
      description: "",
      priceMin: 0,
      priceMax: 0,
      ratePerKm: 0,
      iconName: "material-symbols:plumbing",
      iconColor: "#04697D",
      iconTextColor: "#80d8d6",
      status: ServiceItemStatus.Active,
      subServiceItems: []
    };
    setServicesItem((prev) => [...(prev || []), newItem]);
  }

  const handleAddSubServiceItem = (serviceId: number) => {
    setServicesItem((prev) =>
      prev?.map((item) => {
        if (item.id !== serviceId) return item;

        const newSub: SubServiceItem = {
          id: (item.subServiceItems.length ?? 0) + 1,
          serviceItemId: serviceId,
          title: 'Sub Service',
          description: '',
          iconName: '',
          cost: 0,
          fee: 0,
          gross: 0,
          status: ServiceItemStatus.Active
        };

        const updatedSubs = [...(item.subServiceItems ?? []), newSub];

        const totalPages = Math.ceil(updatedSubs.length / ITEMS_PER_PAGE);
        setModalCurrentPage(totalPages);

        return {
          ...item,
          subServiceItems: updatedSubs
        };
      })
    );
  }

  const resetData = () => {
    setServicesItem(oldServicesItem);
    setHasChanges(false);
    setShowColorPicker(false);
  }

  const resetToDefaults = async () => {
    setResetDialogOpen(false);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("⚠️ Missing authorization token. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${baseApiUrl}/service-items/reset-defaults`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          validateStatus: (status) => status === 200 || status === 201, // ✅ Allow 200 or 201
        }
      );

      if (response.data.success || response.status === 201) { // ✅ Handle both
        await fetchServices();

        setHasChanges(false);
        setShowColorPicker(false);
        setIsEditing(false);

        alert("✅ Services and sub-services have been reset to defaults!");
      } else {
        throw new Error(response.data.message || "Reset failed.");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error resetting to defaults:", err);
      setError(err.message || "Unknown error occurred");
      alert("❌ Failed to reset services. Check console for details.");
    } finally {
      setLoading(false);
    }
  };



  const saveData = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError(null);
    try {
      const normalizedServices = servicesItem?.map(item => ({
        ...item,
        priceMin: item.priceMin.toString(),
        priceMax: item.priceMax.toString(),
        ratePerKm: item.ratePerKm?.toString() ?? null,
        markAsDelete: item.markAsDelete,
        subServices: item.subServiceItems?.map((subItem) => ({
          ...subItem,
          cost: subItem.cost?.toString() ?? "0",
          fee: subItem.fee?.toString() ?? "0",
          gross: subItem.gross?.toString() ?? "0",
          markAsDelete: subItem.markAsDelete ?? false,
        })) ?? [],
      }));
      const response = await axios.post(`${baseApiUrl}/service-items/save`,
        {serviceItems: normalizedServices},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        fetchServices();
        alert('Service Items saved!');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err);
      console.log('Error saving service items', error);
    } finally {
      setLoading(false);
    }
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
        item.id === deletedId ? { ...item, markAsDelete: true, } : item,
      )
    );
  }

  const handleUndoDelete = () => {
    setServicesItem(prev =>
      prev?.map(item =>
        item.id === deletedId ? { ...item, markAsDelete: false } : item
      )
    );
    setSelectedId(-1);
    setDeletedId(-1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChangeValue = (id: number, key: string, value: any) => {
    const clickedItem = servicesItem?.find(item => item.id === id);
    if (!clickedItem) return;

    setSelectedId(id);
    setServicesItem(prev =>
      prev?.map(item =>
        item.id === id ? { ...item, [key]: value } : item,
      )
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChangeSubValue = (id: number, key: string, value: any) => {
    setServicesItem((prev) =>
      prev?.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              subServiceItems: item.subServiceItems.map((sub) =>
                sub.id === id ? { ...sub, [key]: value } : sub
              ),
            }
          : item
      )
    );
  }

  const handleCloseHexColorPicker = () => {
    if (selectedSubServiceId) {
      setIsModalOpen(true);
      setShowColorPicker(false);
      return;
    }
    
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

  const selectedSubServiceIconName = React.useMemo(() => {
    return selectedId >= 0 && servicesItem
      ? servicesItem.find((item) => item.id === selectedId)
        ?.subServiceItems.find((subItem) =>
          subItem.id == selectedSubServiceId
        )?.iconName
      : undefined;
  }, [selectedId, servicesItem, selectedSubServiceId]);

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

  const handleSubServiceItemEdit = (id: number) => {
    const selectedServiceId = servicesItem?.find((item) => item.id === id)?.id;
    const selectedServiceTitle = servicesItem?.find((item) => item.id === id)?.title;
    
    if (!selectedServiceId) return;

    setSelectedId(selectedServiceId);
    setSubServiceSearchQuery(''); // Reset search when opening modal
    setModalCurrentPage(1); // Reset to first page

    setModalTitle(selectedServiceTitle ?? '');
    setIsModalOpen(true);
  }

  // Filter sub-services based on search query for modal
  const filteredSubServices = useMemo(() => {
    const subServices = servicesItem
      ?.find((item) => item.id === selectedId)
      ?.subServiceItems || [];
    
    if (!subServiceSearchQuery.trim()) {
      return subServices;
    }

    const query = subServiceSearchQuery.toLowerCase();
    return subServices.filter((subItem) =>
      subItem.title.toLowerCase().includes(query) ||
      subItem.description?.toLowerCase().includes(query)
    );
  }, [servicesItem, selectedId, subServiceSearchQuery]);

  // Paginate modal sub-services
  const paginatedModalSubServices = useMemo(() => {
    const startIndex = (modalCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredSubServices.slice(startIndex, endIndex);
  }, [filteredSubServices, modalCurrentPage]);

  const modalTotalPages = Math.ceil(filteredSubServices.length / ITEMS_PER_PAGE);

  // Filter non-editing sub-services based on search query
  const filteredNonEditingSubServices = useMemo(() => {
    const subServices = servicesItem
      ?.find((item) => item.id === selectedId)
      ?.subServiceItems || [];
    
    if (!nonEditingSubServiceSearchQuery.trim()) {
      return subServices;
    }

    const query = nonEditingSubServiceSearchQuery.toLowerCase();
    return subServices.filter((subItem) =>
      subItem.title.toLowerCase().includes(query) ||
      subItem.description?.toLowerCase().includes(query)
    );
  }, [servicesItem, selectedId, nonEditingSubServiceSearchQuery]);

  // Paginate non-editing sub-services
  const paginatedNonEditingSubServices = useMemo(() => {
    const startIndex = (nonEditingCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredNonEditingSubServices.slice(startIndex, endIndex);
  }, [filteredNonEditingSubServices, nonEditingCurrentPage]);

  const nonEditingTotalPages = Math.ceil(filteredNonEditingSubServices.length / ITEMS_PER_PAGE);

  // Reset pagination when search query changes
  useEffect(() => {
    setModalCurrentPage(1);
  }, [subServiceSearchQuery]);

  useEffect(() => {
    setNonEditingCurrentPage(1);
  }, [nonEditingSubServiceSearchQuery]);

  const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={clsx(localStorage.getItem("theme") == 'dark' && "cursor-pointer border-slate-600", "p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed")}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={clsx(localStorage.getItem("theme") == 'dark' && "border-slate-600", "cursor-pointer p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed")}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col gap-3 sm:gap-4">
        <label className="block mb-1 font-medium text-sm sm:text-base">
          Services Type
        </label>
        <div className="flex flex-col justify-center">
          {/* Action Buttons */}
          <div className="flex flex-row justify-between gap-2 mb-4 flex-wrap">
            <button 
              type="button" 
              className="btn btn-sm sm:btn-md" 
              onClick={() => setResetDialogOpen(true)}
            >
              Reset to Defaults
            </button>
            <div className="flex flex-row justify-end">
              <div className="flex flex-row gap-2">
                {hasChanges && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-sm sm:btn-md" 
                      onClick={saveData}
                    >
                      Save
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-sm sm:btn-md" 
                      onClick={resetData}
                    >
                      Reset
                    </button>
                  </>
                )}
                <button type="button" className={clsx("btn btn-sm sm:btn-md", isEditing && "btn bg-gray-500!")} onClick={() => setIsEditing((prev) => !prev)}>
                  Edit Services
                </button>
              </div>
            </div>
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
              <div className={clsx(localStorage.getItem("theme") == 'dark' ? "bg-slate-800" : "bg-white", "fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:right-4 sm:top-20 sm:translate-y-0 rounded-lg shadow-xl z-50 p-4 max-w-sm mx-auto sm:mx-0")}>
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
                    setServicesItem((prev) => 
                      prev
                        ? prev.map((item) =>
                          item.id === selectedId ? { ...item, [key]: color } : item,
                        )
                        : []
                    );
                  }}
                  style={{ width: '100%' }}
                  className="z-99999"
                />
                <div className="mt-4 flex gap-4 items-center justify-center">
                  <div className="flex flex-col gap-1 sm:gap-2 items-center">
                    <div
                      style={{ backgroundColor: selectedIconColor }}
                      className="border rounded-2xl p-3 sm:p-4 text-center transition-all peer-checked:border-[#034B57] peer-checked:bg-[#04697D] hover:border-[#04697D] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center text-sm sm:text-base"
                    >
                      {selectedIconName && (() => {
                        const Icon = getIconComponent(selectedSubServiceId ? selectedSubServiceIconName! : selectedIconName);
                        return <Icon className="w-5 h-5" style={{ color: selectedIconTextColor }} />;
                      })()}
                    </div>
                    <p 
                      className="text-center text-xs sm:text-sm"
                    >
                      {selectedServiceTitle}
                    </p>
                  </div>
                  {!selectedSubServiceId && (
                    <ColorInput
                      selectedColorInput="iconColor"
                      setSelectedColorInput={setSelectedColorInput}
                      currentValue={selectedIconColor ?? ''}
                      setServicesItem={setServicesItem}
                      selectedId={selectedId}
                      className="flex-1 text-sm"
                    />
                  )}
                </div>
                {!selectedSubServiceId && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Icon Color:</span>
                      
                      <ColorInput
                        selectedColorInput="iconTextColor"
                        setSelectedColorInput={setSelectedColorInput}
                        currentValue={selectedIconTextColor ?? ''}
                        setServicesItem={setServicesItem}
                        selectedId={selectedId}
                        className="flex-1 text-sm"
                      />

                    </div>
                  </div>
                )}
                <div className="mt-4 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">Selected Icon{selectedSubServiceId && '(Sub)'}:</span>
                    <span className="text-sm text-gray-700">
                      {selectedSubServiceId ? selectedSubServiceIconName : selectedIconName}
                    </span>
                  </div>
                  <IconifyPicker
                    value={selectedSubServiceId ? selectedSubServiceIconName : selectedIconName}
                    onChange={(value) => {
                      if (!servicesItem) return;

                      if (selectedSubServiceId) {
                        // Update state safely
                        setServicesItem((prev) => {
                          if (!prev) return prev;
                          return prev.map((item) => {
                            if (item.id !== selectedId) return item;
                            return {
                              ...item,
                              subServiceItems: item.subServiceItems.map((sub) =>
                                sub.id === selectedSubServiceId
                                  ? { ...sub, iconName: value ?? '' }
                                  : sub
                              ),
                            };
                          });
                        });
                      } else {
                        // Main service icon update
                        setServicesItem((prev) => {
                          if (!prev) return prev;
                          return prev.map((item) =>
                            item.id === selectedId ? { ...item, iconName: value ?? '' } : item
                          );
                        });
                      }
                    }}
                  />

                </div>
              </div>
            </>
          )}

          {/* Services Grid */}
          <div className="rounded-lg">
            <div 
              id="serviceTypeArea" 
              className="p-4 sm:p-8 lg:p-12 card bg-base-100 shadow-sm w-full max-w-6xl mx-auto"
            >
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-slate-600">Loading services...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {servicesItem && servicesItem.map((item) => 
                    <div key={item.id} className={clsx(item.markAsDelete && "bg-red-200 rounded-2xl")}>
                      <ServiceItemCard 
                        serviceItem={item}
                        isEditing={isEditing} 
                        onClickCard={(id) => {
                          const clickedItem = servicesItem.find(item => item.id === id);
                          if (!clickedItem) return;

                          setSelectedSubServiceId(null);
                          setSelectedId(id);
                          if (!isEditing) return;
                          setShowColorPicker(true);
                        }}
                        onDelete={(id) => {
                          const clickedItem = servicesItem.find(item => item.id === id);
                          if (!clickedItem) return;

                          if (clickedItem.markAsDelete) {
                            handleUndoDelete();
                            return;
                          }

                          setSelectedId(id);
                          setDeletedId(id);
                          setConfirmDialogOpen(true);
                        }}
                        onChangeValue={onChangeValue}
                      />
                      {isEditing && (
                        <div className="flex flex-col justify-center gap-2 mt-2 mb-2">
                          <select
                            value={item.status}
                            className="select"
                            onChange={(e) => onChangeValue(item.id, 'status', e.target.value)}
                          >
                            {serviceItemStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn text-xs flex flex-row gap-2 items-center"
                            onClick={() => handleSubServiceItemEdit(item.id)}
                          >
                            <PencilIcon className="w-3 h-3" />
                            Sub Services
                          </button>
                        </div>
                      )}
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
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {!isEditing && servicesItem?.find((item) => item.id === selectedId)?.subServiceItems.length ? (
          <>
            {/* Search Input for Non-Editing Mode */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sub-services..."
                  value={nonEditingSubServiceSearchQuery}
                  onChange={(e) => setNonEditingSubServiceSearchQuery(e.target.value)}
                  className={clsx(localStorage.getItem("theme") == 'dark' ? "border-gray-700" : "border-gray-300", "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500")}
                />
                {nonEditingSubServiceSearchQuery && (
                  <button
                    onClick={() => setNonEditingSubServiceSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {nonEditingSubServiceSearchQuery && (
                <p className="text-xs text-gray-500 mt-1">
                  Found {filteredNonEditingSubServices.length} result{filteredNonEditingSubServices.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Sub-Services Grid */}
            {filteredNonEditingSubServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sub-services found matching your search.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-2">
                  {paginatedNonEditingSubServices.map((subItem) => (
                    <SubServiceItemCard
                      key={subItem.id}
                      subServiceItem={subItem}
                      isEditing={isEditing}
                      onClickCard={() => {}}
                      onChangeSubValue={onChangeSubValue}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
                <Pagination 
                  currentPage={nonEditingCurrentPage}
                  totalPages={nonEditingTotalPages}
                  onPageChange={setNonEditingCurrentPage}
                />
              </>
            )}
          </>
        ) : null}
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

      <AlertDialog
        isOpen={isResetDialogOpen}
        title="Reset to Defaults"
        message="Are you sure you want to reset to default services? This will replace all current services and sub-services with the original defaults and save immediately."
        onConfirm={resetToDefaults}
        onCancel={() => setResetDialogOpen(false)}
      />

      <Modal
        isOpen={isModalOpen}
        title={modalTitle}
        onClose={() => {
          setIsModalOpen(false);
          setSubServiceSearchQuery('');
          setModalCurrentPage(1);
        }}
        footer={
          <>
            {/* Add Button */}
            <div
              onClick={() => handleAddSubServiceItem(selectedId!)}
              className={clsx(localStorage.getItem("theme") == 'dark' && "border-slate-600", "flex flex-row border rounded-lg p-4 justify-center items-center gap-2 cursor-pointer hover:bg-gray-200 transition-all duration-300")}
            >
              <Icon icon="material-symbols:add" />
              <p>Add Sub-Service Item</p>
            </div>
          </>
        }
      >
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sub-services..."
              value={subServiceSearchQuery}
              onChange={(e) => setSubServiceSearchQuery(e.target.value)}
              className={clsx(localStorage.getItem("theme") == 'dark' ? "border-gray-700" : "border-gray-300", "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500")}
            />
            {subServiceSearchQuery && (
              <button
                onClick={() => setSubServiceSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {subServiceSearchQuery && (
            <p className="text-xs text-gray-500 mt-1">
              Found {filteredSubServices.length} result{filteredSubServices.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Sub-Services List */}
        <div>
          {filteredSubServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {subServiceSearchQuery ? 'No sub-services found matching your search.' : 'No sub-services available.'}
            </div>
          ) : (
            <>
              {paginatedModalSubServices.map((subItem) => (
                <SubServiceItemCard
                  key={subItem.id}
                  subServiceItem={subItem}
                  isEditing={isEditing}
                  onClickCard={(id) => {
                    setSelectedSubServiceId(id);
                    setShowColorPicker(true);
                    setIsModalOpen(false);
                  }}
                  onChangeSubValue={onChangeSubValue}
                  onDelete={(id) => {
                    setServicesItem((prev) =>
                      prev?.map((item) =>
                        item.id === selectedId
                          ? {
                              ...item,
                              subServiceItems: item.subServiceItems.map((sub) =>
                                sub.id === id ? { ...sub, markAsDelete: !sub.markAsDelete } : sub
                              ),
                            }
                          : item
                      )
                    );
                  }}
                />
              ))}
              <Pagination 
                currentPage={modalCurrentPage}
                totalPages={modalTotalPages}
                onPageChange={setModalCurrentPage}
              />
            </>
          )}
        </div>
      </Modal>

    </div>
  )
}

export default ServicesPage;
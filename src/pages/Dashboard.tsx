import { useState, useEffect, type ReactNode } from "react";
import { Ban, CheckCircle, Clock, Power, Users, MoreVertical, Eye, Edit, Trash2, ChevronLeft, ChevronRight, User } from "lucide-react";
import axios from "axios";
import { useForm } from "react-hook-form";
import StatsCard from "@/components/ui/stats-card";
import type { Manong, ManongProfile, AppUser } from "@/types";
import Modal from "@/components/ui/modal";
import clsx from "clsx";

interface UpdateManongForm {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  status: string;
  yearsExperience: number;
  experienceDescription: string;
}

const Dashboard = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [manongs, setManongs] = useState<Manong[]>([]);
  const [filteredManongs, setFilteredManongs] = useState<Manong[]>([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [modalTitle, setModalTitle] = useState<string>('My Modal');
  const [modalContent, setModalContent] = useState<ReactNode>(<></>);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    busy: 0,
    offline: 0,
    suspended: 0,
    deleted: 0,
  });

  // Edit state
  const [editingManong, setEditingManong] = useState<number | null>(null);
  const [expandedManongs, setExpandedManongs] = useState<Set<number>>(new Set());

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateManongForm>();

  const tabs = [
    { label: "All Manongs", count: stats.total, status: null },
    { label: "Available", count: stats.available, status: "available" },
    { label: "Busy", count: stats.busy, status: "busy" },
    { label: "Offline", count: stats.offline, status: "offline" },
    { label: "Suspended", count: stats.suspended, status: "suspended" },
    { label: "Deleted", count: stats.deleted, status: "deleted" },
  ];

  const fetchManongs = async (page = 1, serviceItemId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${baseApiUrl}/manongs/all?page=${page}&limit=${limit}`,
        { serviceItemId: serviceItemId || undefined },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        console.log(response.data);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizedManongs = data.map((item: any) => ({
          id: item.id,
          user: {
            id: item.id,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            role: item.role,
            phone: item.phone,
            addressLine: item.addressLine,
            status: item.status,
            deletedAt: item.deletedAt,
          },
          manongProfile: item.manongProfile,
          providerVerifications: item.providerVerifications,
        }));

        console.log('Normalized Data:', normalizedManongs);

        
        setManongs(normalizedManongs);

        

        setFilteredManongs(normalizedManongs);
        
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || normalizedManongs.length || 0);
        setCurrentPage(page);
        
        calculateStats(normalizedManongs);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching manongs:', err);
      setError(err.response?.data?.message || 'Failed to fetch manongs');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Manong[]) => {
    setStats({
      total: data.length,
      available: data.filter(m => m.manongProfile.status === "available" && m.user.deletedAt === null).length,
      busy: data.filter(m => m.manongProfile.status === "busy" && m.user.deletedAt === null).length,
      offline: data.filter(m => m.manongProfile.status === "offline" && m.user.deletedAt === null).length,
      suspended: data.filter(m => m.manongProfile.status === "suspended").length,
      deleted: data.filter(m => m.user.deletedAt !== null).length,
    });
  };

  const filterManongsByStatus = (status: string | null) => {
    if (!status) {
      setFilteredManongs(manongs);
    } else {
      const filtered = manongs.filter(m => m.manongProfile.status === status);
      setFilteredManongs(filtered);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedManongs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEditClick = (m: Manong) => {
    setEditingManong(m.id);
    reset({
      firstName: m.user.firstName || '',
      lastName: m.user.lastName || '',
      phone: m.user.phone || '',
      addressLine: m.user.addressLine || '',
      status: m.user.status || 'pending',
      yearsExperience: m.manongProfile.yearsExperience || 0,
      experienceDescription: m.manongProfile.experienceDescription || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingManong(null);
    reset();
  };

  const onSubmit = async (data: UpdateManongForm) => {
    if (!editingManong) return;

    try {
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${baseApiUrl}/manongs/${editingManong}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }

      );

      // Refresh the data
      await fetchManongs(currentPage);
      setEditingManong(null);
      reset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error updating manong:', err);
      setError(err.response?.data?.message || 'Failed to update manong');
    }
  };

  useEffect(() => {
    fetchManongs(1);
  }, []);

  const handleTabChange = (index: number) => {
    setSelectedTabIndex(index);
    setCurrentPage(1);
    setSelectedItems(new Set());
    
    const selectedTab = tabs[index];
    filterManongsByStatus(selectedTab.status);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchManongs(newPage);
      setSelectedTabIndex(0); // Reset to "All Manongs" when changing pages
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredManongs.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredManongs.map(m => m.id)));
    }
  };

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
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

  const getSpecialities = (
    manongProfile: ManongProfile,
    isExpanded: boolean,
    toggle: () => void
  ) => {
    const list = manongProfile.manongSpecialities || [];

    if (list.length === 0) return "No specialities";

    const titles = list.map(s => s.subServiceItem.title);

    if (isExpanded) {
      return (
        <>
          {titles.join(", ")}{" "}
          <button
            onClick={toggle}
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
            onClick={toggle}
            className="text-blue-600 hover:underline text-sm cursor-pointer"
          >
            (+{hiddenCount} more)
          </button>
        </>
      );
    }

    return visible.join(", ");
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this manong?');
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(`${baseApiUrl}/manongs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.data?.id || response.data?.success) {
        setManongs((prev) => prev.filter((m) => m.id !== id));
        setFilteredManongs((prev) => prev.filter((m) => m.id !== id));
      }

      if (response.status === 204) {
        setManongs((prev) => prev.filter((m) => m.id !== id));
        setFilteredManongs((prev) => prev.filter((m) => m.id !== id));
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error deleting manong:', err);
      setError(err.response?.data?.message || 'Failed to delete manong');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const confirmDelete = window.confirm(`Delete ${selectedItems.size} manong(s)?`);
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const ids = Array.from(selectedItems);

      const response = await axios.post(
        `${baseApiUrl}/manongs/bulk-delete`,
        { ids },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      if (response.data.success) {
        // Filter out deleted items from UI
        setManongs((prev) => prev.filter((m) => !selectedItems.has(m.id)));
        setFilteredManongs((prev) => prev.filter((m) => !selectedItems.has(m.id)));
        setSelectedItems(new Set());
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error bulk deleting manongs:', err);
      setError(err.response?.data?.message || 'Failed to delete selected manongs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard title="Total" value={stats.total} Icon={Users} />
          <StatsCard
            title="Available"
            value={stats.available}
            Icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatsCard
            title="Busy"
            value={stats.busy}
            Icon={Clock}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <StatsCard
            title="Offline"
            value={stats.offline}
            Icon={Power}
            color="text-slate-600"
            bgColor="bg-slate-100"
          />
          <StatsCard
            title="Suspended"
            value={stats.suspended}
            Icon={Ban}
            color="text-violet-600"
            bgColor="bg-violet-100"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Tabs and Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-slate-200 px-6">
            <div className="flex gap-8 overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => handleTabChange(index)}
                  className={`py-4 px-2 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    selectedTabIndex === index
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100">
                    {tab.count}
                  </span>
                  {selectedTabIndex === index && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedItems.size > 0 && (
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-slate-600">{selectedItems.size} selected</p>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
            </div>
          )}

          {/* Table - Card Layout */}
          <div className="p-6">
            {/* Select All */}
            {filteredManongs.length > 0 && (
              <div className="mb-4 flex items-center gap-2 pb-3 border-b border-slate-200">
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredManongs.length && filteredManongs.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">
                  {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
                </span>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-slate-600">Loading manongs...</p>
              </div>
            ) : (
              <>
                {/* Manongs List */}
                <div className="space-y-4">
                  {filteredManongs.map((m) => (
                    <form
                      key={m.id}
                      onSubmit={handleSubmit(onSubmit)}
                      className={clsx("border border-slate-200 rounded-lg p-5 hover:shadow-md transition-all hover:border-blue-200", m.user.status == 'deleted' && "bg-red-200")}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedItems.has(m.id)}
                          onChange={() => toggleSelectItem(m.id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Avatar and Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {m.user?.profilePhoto ? (
                            <img
                              src={m.user?.profilePhoto}
                              alt={getFullName(m.user)}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="bg-gradient-primary w-10 h-10 rounded-full flex items-center justify-center">
                              <User color="white" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {editingManong === m.id ? (
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
                                <h3 className="font-semibold text-slate-800 truncate">{getFullName(m.user)}</h3>
                                <p className="text-sm text-slate-500">{m.user?.phone}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            m.manongProfile.status
                          )}`}
                        >
                          {formatStatus(m.manongProfile.status)}
                        </span>

                        {/* Actions Menu */}
                        <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
                          <MoreVertical size={20} />
                        </button>
                      </div>

                      {/* Details Grid */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b gap-2 border-slate-100">
                          <span className="text-slate-500">Specialities</span>
                          <div className="p-4 bg-white rounded-lg shadow">
                            <p className="text-sm text-gray-600 text-start">
                              {getSpecialities(
                                m.manongProfile,
                                expandedManongs.has(m.id),
                                () => toggleExpand(m.id)
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Experience</span>
                          {editingManong === m.id ? (
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
                            <span className="text-slate-800 font-medium">{m.manongProfile.yearsExperience || 0} years</span>
                          )}
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Assistants</span>
                          <span className="text-slate-800 font-medium">{m.manongProfile.manongAssistants?.length || 0}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Verified</span>
                          <span className="text-slate-800 font-medium text-right">{m.manongProfile.isProfessionallyVerified ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100 md:col-span-2">
                          <span className="text-slate-500">Address</span>
                          {editingManong === m.id ? (
                            <div className="flex-1 ml-4">
                              <input
                                {...register("addressLine")}
                                type="text"
                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                placeholder="Address"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-800 font-medium text-right">{m.user?.addressLine || "N/A"}</span>
                          )}
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100 md:col-span-2">
                          <span className="text-slate-500">Description</span>
                          {editingManong === m.id ? (
                            <div className="flex-1 ml-4">
                              <textarea
                                {...register("experienceDescription")}
                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                placeholder="Description"
                                rows={2}
                              />
                            </div>
                          ) : (
                            <span className="text-slate-800 font-medium text-right">{m.manongProfile.experienceDescription || "N/A"}</span>
                          )}
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100 md:col-span-2">
                          <span className="text-slate-500">Status</span>
                          {editingManong === m.id ? (
                            <div>
                              <select
                                {...register("status", { required: "Status is required" })}
                                className="px-2 py-1 text-sm border border-slate-300 rounded"
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
                            <span className="text-slate-800 font-medium text-right">{m.user?.status || "N/A"}</span>
                          )}
                        </div>
                        {m.providerVerifications?.map(p => (
                          <div key={p.id} className="flex justify-between py-2 border-b border-slate-100 md:col-span-2">
                            <span className="text-slate-500">{p.documentType}</span>
                            <span className="text-slate-800 font-medium text-right">
                              <button 
                                type="button"
                                onClick={() => {
                                  setIsModalOpen(true); 
                                  setModalTitle(p.documentType); 
                                  setModalContent(
                                    <div className="flex items-center justify-center">
                                      <img src={`${baseUrl}/${p.documentUrl}`} alt={p.documentType} />
                                    </div>
                                  );
                                }} 
                                className="text-blue-600 hover:underline"
                              >
                                Show
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100">
                        {editingManong === m.id ? (
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
                              onClick={() => handleEditClick(m)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDelete(m.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto">
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && selectedTabIndex === 0 && (
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <div className="text-sm text-slate-600">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                currentPage === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!loading && filteredManongs.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No manongs found</h3>
                <p className="text-sm text-slate-500">
                  {selectedTabIndex > 0 ? "No manongs with this status" : "Try adjusting your filters or check back later"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
      >
        {modalContent}
      </Modal>
    </div>
  );
};

export default Dashboard;
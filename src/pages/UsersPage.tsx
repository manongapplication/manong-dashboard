import { useState, useEffect, type ReactNode } from "react";
import { Ban, CheckCircle, Clock, Users, MoreVertical, Eye, Edit, Trash2, ChevronLeft, ChevronRight, User, Clock10, Verified, Hammer } from "lucide-react";
import axios from "axios";
import { useForm } from "react-hook-form";
import StatsCard from "@/components/ui/stats-card";
import type { AppUser } from "@/types";
import Modal from "@/components/ui/modal";
import clsx from "clsx";

interface UpdateUserForm {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  status: string;
  yearsExperience: number;
  experienceDescription: string;
}

const UsersPage = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [filteredAppUsers, setFilteredAppUsers] = useState<AppUser[]>([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [modalTitle, setModalTitle] = useState<string>('My Modal');
  const [modalContent, setModalContent] = useState<ReactNode>(<></>);
  const [hideDeleted, setHideDeleted] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    onHold: 0,
    verified: 0,
    rejected: 0,
    suspended: 0,
    deleted: 0,
  });

  // Edit state
  const [editingAppUser, setEditingAppUser] = useState<number | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateUserForm>();

  const tabs = [
    { label: "All Manongs", count: stats.total, status: null },
    { label: "Pending", count: stats.pending, status: "pending" },
    { label: "On Hold", count: stats.onHold, status: "onHold" },
    { label: "Verified", count: stats.verified, status: "verified" },
    { label: "Rejected", count: stats.rejected, status: "rejected" },
    { label: "Suspended", count: stats.suspended, status: "suspended" },
    { label: "Deleted", count: stats.deleted, status: "deleted" },
  ];

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');

      console.log(`Token ${token}`);
      
      const response = await axios.get(
        `${baseApiUrl}/user/all?page=${page}&limit=${limit}`,
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

        setAppUsers(data);

        setFilteredAppUsers(data);
        
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || data.length || 0);
        setCurrentPage(page);
        
        calculateStats(data);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: AppUser[]) => {
    const activeUsers = hideDeleted ? data.filter(u => u.deletedAt === null) : data;

    setStats({
      total: hideDeleted ? activeUsers.length : data.length,
      pending: data.filter(u => u.status === "pending" && u.deletedAt === null).length,
      onHold: data.filter(u => u.status === "onHold" && u.deletedAt === null).length,
      verified: data.filter(u => u.status === "verified" && u.deletedAt === null).length,
      rejected: data.filter(u => u.status === "rejected").length,
      suspended: data.filter(u => u.status === "suspended").length,
      deleted: data.filter(u => u.deletedAt !== null).length,
    });
  };


  const filterUserByStatus = (status: string | null) => {
    let filtered = appUsers;
    
    // First filter by hideDeleted
    if (hideDeleted) {
      filtered = filtered.filter(u => u.deletedAt === null);
    }
    
    // Then filter by status
    if (status) {
      filtered = filtered.filter(u => u.status === status);
    }

    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt!).getTime();
      const dateB = new Date(b.createdAt!).getTime();
      
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredAppUsers(filtered);
  };

  useEffect(() => {
    const selectedTab = tabs[selectedTabIndex];
    filterUserByStatus(selectedTab.status);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder]);

  const handleEditClick = (u: AppUser) => {
    setEditingAppUser(u.id);
    reset({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      phone: u.phone || '',
      addressLine: u.addressLine || '',
      status: u.status || 'pending',
    });
  };

  const handleCancelEdit = () => {
    setEditingAppUser(null);
    reset();
  };

  const onSubmit = async (data: UpdateUserForm) => {
    if (!editingAppUser) return;

    try {
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${baseApiUrl}/user/${editingAppUser}`,
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
      await fetchUsers(currentPage);
      setEditingAppUser(null);
      reset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleTabChange = (index: number) => {
    setSelectedTabIndex(index);
    setCurrentPage(1);
    setSelectedItems(new Set());
    
    const selectedTab = tabs[index];

    if (selectedTab.status == 'deleted') {
      setHideDeleted(false);
    } else {
      setHideDeleted(true);
    }

    filterUserByStatus(selectedTab.status);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsers(newPage);
      setSelectedTabIndex(0); // Reset to "All Users" when changing pages
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredAppUsers.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAppUsers.map(u => u.id)));
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
      case "pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "onHold":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "verified":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
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

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const response = await axios.delete(`${baseApiUrl}/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.data?.id || response.data?.success) {
        setAppUsers((prev) => prev.filter((u) => u.id !== id));
        setFilteredAppUsers((prev) => prev.filter((u) => u.id !== id));
      }

      if (response.status === 204) {
        setAppUsers((prev) => prev.filter((u) => u.id !== id));
        setFilteredAppUsers((prev) => prev.filter((u) => u.id !== id));
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const confirmDelete = window.confirm(`Delete ${selectedItems.size} user(s)?`);
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const ids = Array.from(selectedItems);

      const response = await axios.post(
        `${baseApiUrl}/user/bulk-delete`,
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
        setAppUsers((prev) => prev.filter((u) => !selectedItems.has(u.id)));
        setFilteredAppUsers((prev) => prev.filter((u) => !selectedItems.has(u.id)));
        setSelectedItems(new Set());
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error bulk deleting users:', err);
      setError(err.response?.data?.message || 'Failed to delete selected users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hideDeleted) {
      setFilteredAppUsers(appUsers.filter(u => u.deletedAt === null));
    } else {
      const selectedTab = tabs[selectedTabIndex];
      filterUserByStatus(selectedTab.status);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideDeleted, appUsers]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard title="Total" value={stats.total} Icon={Users} />
          <StatsCard
            title="Pending"
            value={stats.pending}
            Icon={Clock}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <StatsCard
            title="On Hold"
            value={stats.onHold}
            Icon={Clock10}
            color="text-amber-600"
            bgColor="bg-amber-100"
          />
          <StatsCard
            title="Verified"
            value={stats.verified}
            Icon={Verified}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatsCard
            title="Rejected"
            value={stats.rejected}
            Icon={Hammer}
            color="text-red-600"
            bgColor="bg-red-100"
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
            <div className="mt-4 px-4 flex justify-between items-center">
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
            {filteredAppUsers.length > 0 && (
              <div className="mb-4 flex justify-between items-center gap-2 pb-3 border-b border-slate-200">
                <div className="flex flex-row items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredAppUsers.length && filteredAppUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">
                    {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
                  </span>

                  <input
                    type="checkbox"
                    checked={hideDeleted}
                    onChange={() => {setHideDeleted((prev) => !prev)}}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">
                    Hide deleted
                  </span>
                </div>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                  className="ml-4 px-3 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-slate-600">Loading users...</p>
              </div>
            ) : (
              <>
                {/* Manongs List */}
                <div className="space-y-4">
                  {filteredAppUsers.map((u) => (
                    <form
                      key={u.id}
                      onSubmit={handleSubmit(onSubmit)}
                      className={clsx("border border-slate-200 rounded-lg p-5 hover:shadow-md transition-all hover:border-blue-200", u.status == 'deleted' && "bg-red-200")}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedItems.has(u.id)}
                          onChange={() => toggleSelectItem(u.id)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Avatar and Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {u.profilePhoto ? (
                            <img
                              src={u.profilePhoto}
                              alt={getFullName(u)}
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="bg-gradient-primary w-10 h-10 rounded-full flex items-center justify-center">
                              <User color="white" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {editingAppUser === u.id ? (
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
                                <h3 className="font-semibold text-slate-800 truncate">{getFullName(u)}</h3>
                                <p className="text-sm text-slate-500">{u.phone}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            u.status
                          )}`}
                        >
                          {formatStatus(u.status)}
                        </span>

                        {/* Actions Menu */}
                        <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
                          <MoreVertical size={20} />
                        </button>
                      </div>

                      {/* Details Grid */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-slate-100 md:col-span-2">
                          <span className="text-slate-500">Address</span>
                          {editingAppUser === u.id ? (
                            <div className="flex-1 ml-4">
                              <input
                                {...register("addressLine")}
                                type="text"
                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                placeholder="Address"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-800 font-medium text-right">{u.addressLine || "N/A"}</span>
                          )}
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100 md:col-span-2">
                          <span className="text-slate-500">Status</span>
                          {editingAppUser === u.id ? (
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
                            <span className="text-slate-800 font-medium text-right">{u.status || "N/A"}</span>
                          )}
                        </div>
                        {u.providerVerifications?.map(p => (
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
                        {editingAppUser === u.id ? (
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
                              onClick={() => handleEditClick(u)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDelete(u.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto">
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
            {!loading && filteredAppUsers.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No users found</h3>
                <p className="text-sm text-slate-500">
                  {selectedTabIndex > 0 ? "No users with this status" : "Try adjusting your filters or check back later"}
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

export default UsersPage;
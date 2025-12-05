import { useState, useEffect, type ReactNode } from "react";
import { Ban, CheckCircle, Clock, Power, Users, ChevronLeft, ChevronRight, Trash2, Search, CheckSquare, Star } from "lucide-react";
import axios from "axios";
import StatsCard from "@/components/ui/stats-card";
import type { Manong } from "@/types";
import Modal from "@/components/ui/modal";
import ManongCard from "@/components/ui/manong-card";
import clsx from "clsx";
import { Helmet } from 'react-helmet';
import SpecialitiesModal from "@/components/ui/specialities-modal";

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
  const [hideDeleted, setHideDeleted] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedManongs, setExpandedManongs] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'completed' | 'rating'>('newest');
  const [overallStats, setOverallStats] = useState({
    totalCompletedServices: 0,
    averageOverallRating: 0,
  });

  const toggleExpand = (id: number) => {
    setExpandedManongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };
  
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

  const tabs = [
    { label: "All Manongs", count: stats.total, status: null },
    { label: "Available", count: stats.available, status: "available" },
    { label: "Busy", count: stats.busy, status: "busy" },
    { label: "Offline", count: stats.offline, status: "offline" },
    { label: "Suspended", count: stats.suspended, status: "suspended" },
    { label: "Deleted", count: stats.deleted, status: "deleted" },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchManongs = async (page = 1, serviceItemId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Build query parameters
      let url = `${baseApiUrl}/manongs/with-stats?page=${page}&limit=${limit}`;
      
      // Add search query if it exists
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await axios.post(
        url,
        {}, // Empty body since search is now in query params
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      // Now response.data should have success: true and data: [...]
      if (response.data.success) {
        const data = response.data.data;

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
            createdAt: item.createdAt,
            deletedAt: item.deletedAt,
          },
          manongProfile: item.manongProfile,
          providerVerifications: item.providerVerifications || [],
          stats: item.stats || {
            completedServices: 0,
            averageRating: 0,
            ratingCount: 0
          }
        }));

        // Calculate overall stats
        calculateOverallStats(normalizedManongs);
        
        // Sort with new options
        const sorted = sortManongs(normalizedManongs);

        setManongs(sorted);
        
        // Apply filters
        const selectedTab = tabs[selectedTabIndex];
        let filtered = sorted;

        // Hide deleted if needed
        if (hideDeleted) {
          filtered = filtered.filter(m => m.user.deletedAt === null);
        }

        // Filter by selected tab
        if (selectedTab.status) {
          filtered = filtered.filter(m => m.user.status === selectedTab.status);
        }

        // No need to apply search filter - backend already did it
        setFilteredManongs(filtered);

        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || normalizedManongs.length || 0);
        setCurrentPage(page);

        calculateStats(normalizedManongs);
      } else {
        setError('Failed to fetch manongs: API returned unsuccessful');
      }
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching manongs:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      });
      setError(err.response?.data?.message || 'Failed to fetch manongs');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Manong[]) => {
    const activeUsers = hideDeleted ? data.filter(m => m.user.deletedAt === null) : data;

    setStats({
      total: hideDeleted ? activeUsers.length : data.length,
      available: data.filter(m => m.manongProfile.status === "available" && m.user.deletedAt === null).length,
      busy: data.filter(m => m.manongProfile.status === "busy" && m.user.deletedAt === null).length,
      offline: data.filter(m => m.manongProfile.status === "offline" && m.user.deletedAt === null).length,
      suspended: data.filter(m => m.manongProfile.status === "suspended").length,
      deleted: data.filter(m => m.user.deletedAt !== null).length,
    });
  };

  const filterManongsByStatus = (status: string | null) => {
    let filtered = manongs;
    
    // First filter by hideDeleted
    if (hideDeleted) {
      filtered = filtered.filter(m => m.user.deletedAt === null);
    }
    
    // Then filter by status
    if (status) {
      filtered = filtered.filter(m => m.user.status === status);
    }

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      filtered = filtered.filter(manong => 
        manong.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manong.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manong.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manong.user.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${manong.user.firstName} ${manong.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply new sorting
    filtered = sortManongs(filtered);
    
    setFilteredManongs(filtered);
  };

  const calculateOverallStats = (data: Manong[]) => {
    const activeManongs = data.filter(m => m.user.deletedAt === null);
    
    const totalCompletedServices = activeManongs.reduce(
      (sum, manong) => sum + (manong.stats?.completedServices || 0), 
      0
    );
    
    const manongsWithRatings = activeManongs.filter(m => 
      m.stats?.ratingCount && m.stats.ratingCount > 0
    );
    
    const averageOverallRating = manongsWithRatings.length > 0
      ? manongsWithRatings.reduce(
          (sum, manong) => sum + (manong.stats?.averageRating || 0), 
          0
        ) / manongsWithRatings.length
      : 0;

    setOverallStats({
      totalCompletedServices,
      averageOverallRating: parseFloat(averageOverallRating.toFixed(1))
    });
  };

  const sortManongs = (manongs: Manong[]) => {
    return [...manongs].sort((a, b) => {
      if (sortBy === 'completed') {
        const aJobs = a.stats?.completedServices || 0;
        const bJobs = b.stats?.completedServices || 0;
        return bJobs - aJobs;
      }
      
      if (sortBy === 'rating') {
        const aRating = a.stats?.ratingCount ? a.stats.averageRating : 0;
        const bRating = b.stats?.ratingCount ? b.stats.averageRating : 0;
        return bRating - aRating;
      }
      
      const dateA = new Date(a.user.createdAt!).getTime();
      const dateB = new Date(b.user.createdAt!).getTime();
      
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    
    const selectedTab = tabs[selectedTabIndex];
    let filtered = manongs;
    
    // Apply hideDeleted filter
    if (hideDeleted) {
      filtered = filtered.filter(m => m.user.deletedAt === null);
    }
    
    // Apply status filter
    if (selectedTab.status) {
      filtered = filtered.filter(m => m.user.status === selectedTab.status);
    }
    
    // Apply search filter
    if (query.trim()) {
      filtered = filtered.filter(manong => 
        manong.user.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        manong.user.lastName?.toLowerCase().includes(query.toLowerCase()) ||
        manong.user.email?.toLowerCase().includes(query.toLowerCase()) ||
        manong.user.phone?.toLowerCase().includes(query.toLowerCase()) ||
        `${manong.user.firstName} ${manong.user.lastName}`.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.user.createdAt!).getTime();
      const dateB = new Date(b.user.createdAt!).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredManongs(filtered);
  };

  useEffect(() => {
    const selectedTab = tabs[selectedTabIndex];
    filterManongsByStatus(selectedTab.status);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder, searchQuery]);

  const handleUpdateManong = async (id: number, data: UpdateManongForm) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${baseApiUrl}/manongs/${id}`,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error updating manong:', err);
      setError(err.response?.data?.message || 'Failed to update manong');
      throw err;
    }
  };

  const handleViewDocument = (documentType: string, documentUrl: string) => {
    setIsModalOpen(true); 
    setModalTitle(documentType); 
    setModalContent(
      <div className="flex items-center justify-center">
        <img src={`${baseUrl}/${documentUrl}`} alt={documentType} />
      </div>
    );
  };

  const [availableSubServiceItems, setAvailableSubServiceItems] = useState<Array<{
    id: number;
    title: string;
    serviceItem: {
      id: number;
      title: string;
    };
  }>>([]);

  const fetchAvailableSubServiceItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${baseApiUrl}/manongs/sub-service-items/available`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );
      
      if (response.data.success) {
        setAvailableSubServiceItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching available sub-service items:', error);
    }
  };

  const handleUpdateSpecialities = async (id: number, subServiceItemIds: number[]) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${baseApiUrl}/manongs/${id}/specialities`,
        { subServiceItemIds },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        // Refresh the manongs data
        await fetchManongs(currentPage);
        return response.data;
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error updating specialities:', err);
      setError(err.response?.data?.message || 'Failed to update specialities');
      throw err;
    }
  };

  useEffect(() => {
    fetchManongs(1);
    fetchAvailableSubServiceItems();
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

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this manong?');
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const response = await axios.delete(`${baseApiUrl}/manongs/${id}`, {
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

  useEffect(() => {
    if (hideDeleted) {
      setFilteredManongs(manongs.filter(m => m.user.deletedAt === null));
    } else {
      const selectedTab = tabs[selectedTabIndex];
      filterManongsByStatus(selectedTab.status);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideDeleted, manongs]);

  const [isSpecialitiesModalOpen, setIsSpecialitiesModalOpen] = useState(false);
  const [selectedManongForSpecialities, setSelectedManongForSpecialities] = useState<number | null>(null);
  const [manongSpecialities, setManongSpecialities] = useState<number[]>([]);

  const handleOpenSpecialitiesModal = (manongId: number, currentSpecialities: number[]) => {
    setSelectedManongForSpecialities(manongId);
    setManongSpecialities(currentSpecialities);
    setIsSpecialitiesModalOpen(true);
  };

  // Add this function
  const handleSaveSpecialities = async (selectedIds: number[]) => {
    if (!selectedManongForSpecialities) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${baseApiUrl}/manongs/${selectedManongForSpecialities}/specialities`,
        { subServiceItemIds: selectedIds },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        await fetchManongs(currentPage);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error updating specialities:', err);
      setError(err.response?.data?.message || 'Failed to update specialities');
      throw err;
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
        <meta
          name="description"
          content="Admin dashboard for Manong: manage service requests, and monitor manongs."
        />
      </Helmet>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {/* Add these new stats cards */}
            <StatsCard
              title="Total Completed"
              value={overallStats.totalCompletedServices}
              Icon={CheckSquare}
              color="text-emerald-600"
              bgColor="bg-emerald-100"
            />
            <StatsCard
              title="Avg Rating"
              value={overallStats.averageOverallRating}
              Icon={Star}
              color="text-yellow-600"
              bgColor="bg-yellow-100"
              isDecimal={true}
              showStar={true}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Tabs and Table Container */}
          <div className={clsx(localStorage.getItem("theme") == 'dark' ? "border-slate-700" : "bg-white border-slate-200", "rounded-xl shadow-sm borde overflow-hidden")}>
            {/* Search Bar */}
            <div className="p-6 border-b border-slate-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search manongs by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

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
              {filteredManongs.length > 0 && (
                <div className="mb-4 flex justify-between items-center gap-2 pb-3 border-b border-slate-200">
                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredManongs.length && filteredManongs.length > 0}
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
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as 'newest' | 'oldest' | 'completed' | 'rating');
                      const selectedTab = tabs[selectedTabIndex];
                      filterManongsByStatus(selectedTab.status);
                    }}
                    className="select max-w-30"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="completed">Most Completed Jobs</option>
                    <option value="rating">Highest Rating</option>
                  </select>
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
                      <ManongCard
                        key={m.id}
                        manong={m}
                        isSelected={selectedItems.has(m.id)}
                        onToggleSelect={toggleSelectItem}
                        onDelete={handleDelete}
                        onUpdate={handleUpdateManong}
                        onEditSpecialities={() => handleOpenSpecialitiesModal(
                          m.id, 
                          m.manongProfile.manongSpecialities?.map(s => s.subServiceItemId) || []
                        )}
                        onUpdateSpecialities={handleUpdateSpecialities}
                        onViewDocument={handleViewDocument}
                        isExpanded={expandedManongs.has(m.id)}
                        toggleExpand={() => toggleExpand(m.id)}
                        isDark={localStorage.getItem("theme") == 'dark' ? true : false}
                        availableSubServiceItems={availableSubServiceItems}
                      />
                    ))}
                  </div>

                  {/* Search Results Info */}
                  {searchQuery.trim() && (
                    <div className="mt-4 text-sm text-slate-600">
                      Found {filteredManongs.length} manong(s) matching "{searchQuery}"
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && selectedTabIndex === 0 && !searchQuery.trim() && (
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
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    {searchQuery.trim() ? "No manongs found matching your search" : "No manongs found"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedTabIndex > 0 ? "No manongs with this status" : "Try adjusting your filters or check back later"}
                  </p>
                  {searchQuery.trim() && (
                    <button
                      onClick={() => handleSearch('')}
                      className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear search
                    </button>
                  )}
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

        <SpecialitiesModal
          isOpen={isSpecialitiesModalOpen}
          onClose={() => {
            setIsSpecialitiesModalOpen(false);
            setSelectedManongForSpecialities(null);
          }}
          currentSpecialities={manongSpecialities}
          availableItems={availableSubServiceItems}
          onSave={handleSaveSpecialities}
          title={`Edit Specialities for Manong #${selectedManongForSpecialities}`}
        />
      </div>
    </>
  );
};

export default Dashboard;
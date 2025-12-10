import { useState, useEffect, type ReactNode } from "react";
import { 
  Smartphone, 
  Globe, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  BarChart3,
} from "lucide-react";
import axios from "axios";
import StatsCard from "@/components/ui/stats-card";
import Modal from "@/components/ui/modal";
import clsx from "clsx";
import { Helmet } from "react-helmet";
import AppVersionCard from "@/components/ui/app-version-card";

export interface AppVersion {
  id: number;
  platform: "ANDROID" | "IOS";
  version: string;
  buildNumber: number;
  isActive: boolean;
  isMandatory: boolean;
  priority: "NORMAL" | "HIGH" | "CRITICAL";
  minVersion?: string;
  releaseNotes?: string;
  whatsNew?: string;
  androidStoreUrl?: string;
  iosStoreUrl?: string;
  releaseDate: Date;
  forceUpdateDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deactivatedAt?: Date;
  userStats?: {
    totalUsers: number;
    activeUsersLast7Days: number;
  };
}

export interface CreateVersionForm {
  platform: string;
  version: string;
  buildNumber: number;
  isMandatory: boolean;
  priority: "NORMAL" | "HIGH" | "CRITICAL";
  minVersion?: string;
  releaseNotes?: string;
  whatsNew?: string;
  androidStoreUrl?: string;
  iosStoreUrl?: string;
  forceUpdateDate?: string;
}

const AppVersionsPage = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [appVersions, setAppVersions] = useState<AppVersion[]>([]);
  const [filteredVersions, setFilteredVersions] = useState<AppVersion[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalContent, setModalContent] = useState<ReactNode>(<></>);
  const [showInactive, setShowInactive] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    android: 0,
    ios: 0,
    mandatory: 0,
    critical: 0,
    inactive: 0,
  });

  const tabs = [
    { label: "All Versions", count: stats.total, platform: null, active: null },
    { label: "Active", count: stats.active, platform: null, active: true },
    { label: "Android", count: stats.android, platform: "ANDROID", active: null },
    { label: "iOS", count: stats.ios, platform: "IOS", active: null },
    { label: "Mandatory", count: stats.mandatory, platform: null, active: null, mandatory: true },
    { label: "Critical", count: stats.critical, platform: null, active: null, priority: "CRITICAL" },
    { label: "Inactive", count: stats.inactive, platform: null, active: false },
  ];

  const fetchVersions = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${baseApiUrl}/app-version/admin/all`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data) {
        const data = response.data;
        console.log("App versions data:", data);

        setAppVersions(data);
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredVersions(sortedData);
        
        // Calculate pagination from array if backend doesn't provide it
        setTotalPages(Math.ceil(data.length / limit));
        setTotalCount(data.length);
        setCurrentPage(page);
        
        calculateStats(data);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching app versions:', err);
      setError(err.response?.data?.message || 'Failed to fetch app versions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: AppVersion[]) => {

    setStats({
      total: data.length,
      active: data.filter(v => v.isActive).length,
      android: data.filter(v => v.platform === "ANDROID").length,
      ios: data.filter(v => v.platform === "IOS").length,
      mandatory: data.filter(v => v.isMandatory).length,
      critical: data.filter(v => v.priority === "CRITICAL").length,
      inactive: data.filter(v => !v.isActive).length,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterVersions = (platform: string | null, active: boolean | null, filters?: any) => {
    let filtered = appVersions;
    
    // First filter by showInactive
    if (!showInactive) {
      filtered = filtered.filter(v => v.isActive);
    }
    
    // Apply platform filter
    if (platform) {
      filtered = filtered.filter(v => v.platform === platform);
    }
    
    // Apply active filter
    if (active !== null) {
      filtered = filtered.filter(v => v.isActive === active);
    }
    
    // Apply additional filters
    if (filters?.mandatory) {
      filtered = filtered.filter(v => v.isMandatory);
    }
    
    if (filters?.priority) {
      filtered = filtered.filter(v => v.priority === filters.priority);
    }

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      filtered = filtered.filter(version => 
        version.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        version.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
        version.whatsNew?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        version.releaseNotes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredVersions(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    
    const selectedTab = tabs[selectedTabIndex];
    
    filterVersions(
      selectedTab.platform,
      selectedTab.active,
      {
        mandatory: selectedTab.mandatory,
        priority: selectedTab.priority
      }
    );
  };

  useEffect(() => {
    const selectedTab = tabs[selectedTabIndex];
    filterVersions(
      selectedTab.platform,
      selectedTab.active,
      {
        mandatory: selectedTab.mandatory,
        priority: selectedTab.priority
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder, searchQuery, showInactive]);

  const handleCreateVersion = async (data: CreateVersionForm) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${baseApiUrl}/app-version/admin/create`,
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
      await fetchVersions(currentPage);
      setIsModalOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error creating version:', err);
      setError(err.response?.data?.message || 'Failed to create version');
      throw err;
    }
  };

  const handleForceUpdate = async (platform: string, minVersion: string) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${baseApiUrl}/app-version/admin/force-update`,
        { platform, minVersion },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      // Refresh the data
      await fetchVersions(currentPage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error forcing update:', err);
      setError(err.response?.data?.message || 'Failed to force update');
      throw err;
    }
  };

  const handleDeleteVersion = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to deactivate this version?');
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${baseApiUrl}/app-version/admin/deactivate/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      // Update UI
      setAppVersions(prev => 
        prev.map(v => v.id === id ? { ...v, isActive: false, deactivatedAt: new Date() } : v)
      );
      setFilteredVersions(prev => 
        prev.map(v => v.id === id ? { ...v, isActive: false, deactivatedAt: new Date() } : v)
      );
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error deleting version:', err);
      setError(err.response?.data?.message || 'Failed to delete version');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const confirmDelete = window.confirm(`Deactivate ${selectedItems.size} version(s)?`);
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const deletePromises = Array.from(selectedItems).map(id =>
        axios.post(
          `${baseApiUrl}/app-version/admin/deactivate/${id}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          }
        )
      );

      await Promise.all(deletePromises);

      // Update UI
      setAppVersions(prev => 
        prev.map(v => selectedItems.has(v.id) ? { ...v, isActive: false, deactivatedAt: new Date() } : v)
      );
      setFilteredVersions(prev => 
        prev.map(v => selectedItems.has(v.id) ? { ...v, isActive: false, deactivatedAt: new Date() } : v)
      );
      setSelectedItems(new Set());
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error bulk deleting versions:', err);
      setError(err.response?.data?.message || 'Failed to delete selected versions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReleaseNotes = (version: AppVersion) => {
    setIsModalOpen(true);
    setModalTitle(`${version.platform} v${version.version} Release Notes`);
    setModalContent(
      <div className="max-h-[60vh] overflow-y-auto">
        <div className="mb-4">
          <h4 className="font-semibold mb-2">What's New:</h4>
          <p className="text-gray-700 whitespace-pre-line">{version.whatsNew || 'No description provided.'}</p>
        </div>
        
        {version.releaseNotes && (
          <div>
            <h4 className="font-semibold mb-2">Full Release Notes:</h4>
            <div 
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: version.releaseNotes }}
            />
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Build Number:</span>
              <p className="font-medium">{version.buildNumber}</p>
            </div>
            <div>
              <span className="text-gray-500">Priority:</span>
              <p className="font-medium">{version.priority}</p>
            </div>
            <div>
              <span className="text-gray-500">Mandatory:</span>
              <p className="font-medium">{version.isMandatory ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <span className="text-gray-500">Release Date:</span>
              <p className="font-medium">{new Date(version.releaseDate).toLocaleDateString()}</p>
            </div>
            {version.minVersion && (
              <div className="col-span-2">
                <span className="text-gray-500">Minimum Version Required:</span>
                <p className="font-medium">{version.minVersion}</p>
              </div>
            )}
            {version.forceUpdateDate && (
              <div className="col-span-2">
                <span className="text-gray-500">Force Update Date:</span>
                <p className="font-medium">{new Date(version.forceUpdateDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const openCreateVersionModal = () => {
    setIsModalOpen(true);
    setModalTitle('Create New App Version');
    setModalContent(
      <CreateVersionFormComponent 
        onSubmit={handleCreateVersion}
        onCancel={() => setIsModalOpen(false)}
      />
    );
  };

  const openForceUpdateModal = () => {
    setIsModalOpen(true);
    setModalTitle('Force Update');
    setModalContent(
      <ForceUpdateFormComponent 
        onSubmit={handleForceUpdate}
        onCancel={() => setIsModalOpen(false)}
      />
    );
  };

  const openStatsModal = () => {
    setIsModalOpen(true);
    setModalTitle('Version Statistics');
    setModalContent(
      <VersionStatsComponent versions={appVersions} />
    );
  };

  useEffect(() => {
    fetchVersions(1);
  }, []);

  const handleTabChange = (index: number) => {
    setSelectedTabIndex(index);
    setCurrentPage(1);
    setSelectedItems(new Set());
    
    const selectedTab = tabs[index];
    
    if (selectedTab.label === 'Inactive') {
      setShowInactive(true);
    } else {
      setShowInactive(false);
    }

    filterVersions(
      selectedTab.platform,
      selectedTab.active,
      {
        mandatory: selectedTab.mandatory,
        priority: selectedTab.priority
      }
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchVersions(newPage);
      setSelectedTabIndex(0); // Reset to "All Versions" when changing pages
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredVersions.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredVersions.map(v => v.id)));
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

  useEffect(() => {
    if (!showInactive) {
      setFilteredVersions(appVersions.filter(v => v.isActive));
    } else {
      const selectedTab = tabs[selectedTabIndex];
      filterVersions(
        selectedTab.platform,
        selectedTab.active,
        {
          mandatory: selectedTab.mandatory,
          priority: selectedTab.priority
        }
      );
    }
  }, [showInactive, appVersions]);

  return (
    <>
      <Helmet>
        <title>App Version Management - Manong Admin</title>
        <meta
          name="description"
          content="Manage app versions for Android and iOS. Create new releases, force updates, and monitor version adoption."
        />
      </Helmet>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              title="Total Versions" 
              value={stats.total} 
              Icon={Globe} 
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatsCard
              title="Active"
              value={stats.active}
              Icon={CheckCircle}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatsCard
              title="Android"
              value={stats.android}
              Icon={Smartphone}
              color="text-emerald-600"
              bgColor="bg-emerald-100"
            />
            <StatsCard
              title="iOS"
              value={stats.ios}
              Icon={Smartphone}
              color="text-gray-600"
              bgColor="bg-gray-100"
            />
            <StatsCard
              title="Mandatory"
              value={stats.mandatory}
              Icon={AlertTriangle}
              color="text-orange-600"
              bgColor="bg-orange-100"
            />
            <StatsCard
              title="Critical"
              value={stats.critical}
              Icon={AlertTriangle}
              color="text-red-600"
              bgColor="bg-red-100"
            />
            <StatsCard
              title="Inactive"
              value={stats.inactive}
              Icon={Clock}
              color="text-gray-600"
              bgColor="bg-gray-100"
            />
            <StatsCard
              title="User Stats"
              value="View"
              Icon={BarChart3}
              color="text-purple-600"
              bgColor="bg-purple-100"
              onClick={openStatsModal}
              isClickable
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={openCreateVersionModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                Create New Version
              </button>
              
              <button
                onClick={openForceUpdateModal}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                <AlertTriangle size={20} />
                Force Update
              </button>
            </div>
            
            <button
              onClick={() => fetchVersions(currentPage)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              <Download size={20} />
              Refresh
            </button>
          </div>

          {/* Tabs and Table Container */}
          <div className={clsx(localStorage.getItem("theme") == 'dark' ? "border-slate-700" : "bg-white border-slate-200", "rounded-xl shadow-sm border overflow-hidden")}>
            {/* Search Bar */}
            <div className="p-6 border-b border-slate-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by version, platform, or description..."
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
                  Deactivate Selected
                </button>
              </div>
            )}

            {/* Table - Card Layout */}
            <div className="p-6">
              {/* Select All */}
              {filteredVersions.length > 0 && (
                <div className="mb-4 flex justify-between items-center gap-2 pb-3 border-b border-slate-200">
                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredVersions.length && filteredVersions.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">
                      {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
                    </span>

                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={() => {setShowInactive((prev) => !prev)}}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">
                      Show inactive
                    </span>
                  </div>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="select max-w-30"
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
                  <p className="mt-4 text-slate-600">Loading app versions...</p>
                </div>
              ) : (
                <>
                  {/* Versions List */}
                  <div className="space-y-4">
                    {filteredVersions.map((version) => (
                      <AppVersionCard
                        key={version.id}
                        version={version}
                        isSelected={selectedItems.has(version.id)}
                        onToggleSelect={toggleSelectItem}
                        onDelete={handleDeleteVersion}
                        onViewDetails={handleViewReleaseNotes}
                        isDark={localStorage.getItem("theme") == 'dark' ? true : false}
                      />
                    ))}
                  </div>

                  {/* Search Results Info */}
                  {searchQuery.trim() && (
                    <div className="mt-4 text-sm text-slate-600">
                      Found {filteredVersions.length} version(s) matching "{searchQuery}"
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
              {!loading && filteredVersions.length === 0 && (
                <div className="text-center py-12">
                  <Globe size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    {searchQuery.trim() ? "No versions found matching your search" : "No app versions found"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedTabIndex > 0 ? "No versions with this filter" : "Create your first app version to get started"}
                  </p>
                  {searchQuery.trim() ? (
                    <button
                      onClick={() => handleSearch('')}
                      className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear search
                    </button>
                  ) : (
                    <button
                      onClick={openCreateVersionModal}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus size={20} />
                      Create First Version
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
      </div>
    </>
  );
};

// Component for Create Version Form
const CreateVersionFormComponent = ({ onSubmit, onCancel }: { onSubmit: (data: CreateVersionForm) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<CreateVersionForm>({
    platform: 'ANDROID',
    version: '',
    buildNumber: 1,
    isMandatory: false,
    priority: 'NORMAL',
    minVersion: '',
    releaseNotes: '',
    whatsNew: '',
    androidStoreUrl: '',
    iosStoreUrl: '',
    forceUpdateDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Platform *
          </label>
          <select
            value={formData.platform}
            onChange={(e) => setFormData({...formData, platform: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="ANDROID">Android</option>
            <option value="IOS">iOS</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Version (SemVer) *
          </label>
          <input
            type="text"
            value={formData.version}
            onChange={(e) => setFormData({...formData, version: e.target.value})}
            placeholder="e.g., 2.0.0"
            pattern="^\d+\.\d+\.\d+$"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Format: major.minor.patch (e.g., 2.1.0)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Build Number *
          </label>
          <input
            type="number"
            value={formData.buildNumber}
            onChange={(e) => setFormData({...formData, buildNumber: parseInt(e.target.value)})}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            value={formData.priority}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Version
          </label>
          <input
            type="text"
            value={formData.minVersion}
            onChange={(e) => setFormData({...formData, minVersion: e.target.value})}
            placeholder="e.g., 1.9.0"
            pattern="^\d+\.\d+\.\d+$"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Versions below this will be forced to update</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Force Update Date
          </label>
          <input
            type="datetime-local"
            value={formData.forceUpdateDate}
            onChange={(e) => setFormData({...formData, forceUpdateDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What's New (Short Description) *
        </label>
        <textarea
          value={formData.whatsNew}
          onChange={(e) => setFormData({...formData, whatsNew: e.target.value})}
          placeholder="Brief description of new features for users..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Release Notes (Full Details)
        </label>
        <textarea
          value={formData.releaseNotes}
          onChange={(e) => setFormData({...formData, releaseNotes: e.target.value})}
          placeholder="Detailed release notes, can include HTML..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Android Store URL
          </label>
          <input
            type="url"
            value={formData.androidStoreUrl}
            onChange={(e) => setFormData({...formData, androidStoreUrl: e.target.value})}
            placeholder="market://details?id=com.yourapp"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            iOS Store URL
          </label>
          <input
            type="url"
            value={formData.iosStoreUrl}
            onChange={(e) => setFormData({...formData, iosStoreUrl: e.target.value})}
            placeholder="https://apps.apple.com/app/idYOUR_APP_ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isMandatory"
          checked={formData.isMandatory}
          onChange={(e) => setFormData({...formData, isMandatory: e.target.checked})}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="isMandatory" className="text-sm font-medium text-gray-700">
          This is a mandatory update
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Create Version
        </button>
      </div>
    </form>
  );
};

// Component for Force Update Form
const ForceUpdateFormComponent = ({ onSubmit, onCancel }: { onSubmit: (platform: string, minVersion: string) => void, onCancel: () => void }) => {
  const [platform, setPlatform] = useState('ANDROID');
  const [minVersion, setMinVersion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(platform, minVersion);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="mr-2 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-semibold mb-1">Warning: Force Update</h4>
            <p className="text-sm">
              This will mark all versions below the specified minimum version as mandatory. 
              Users on older versions will be forced to update before they can use the app.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Platform *
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="ANDROID">Android</option>
          <option value="IOS">iOS</option>
          <option value="ALL">Both Platforms</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Version *
        </label>
        <input
          type="text"
          value={minVersion}
          onChange={(e) => setMinVersion(e.target.value)}
          placeholder="e.g., 2.0.0"
          pattern="^\d+\.\d+\.\d+$"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          All versions below this version will be marked as mandatory.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
        >
          Force Update
        </button>
      </div>
    </form>
  );
};

// Component for Version Statistics
const VersionStatsComponent = ({ versions }: { versions: AppVersion[] }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'ALL' | 'ANDROID' | 'IOS'>('ALL');
  
  const filteredVersions = selectedPlatform === 'ALL' 
    ? versions 
    : versions.filter(v => v.platform === selectedPlatform);
  
  const activeVersions = filteredVersions.filter(v => v.isActive);
  const mandatoryVersions = filteredVersions.filter(v => v.isMandatory);
  
  const latestVersions = {
    android: filteredVersions
      .filter(v => v.platform === 'ANDROID' && v.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    ios: filteredVersions
      .filter(v => v.platform === 'IOS' && v.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
  };

  // Calculate adoption rates (simulated - you'd get this from your backend)
  const calculateAdoptionRate = (version: AppVersion | undefined) => {
    if (!version || !version.userStats) return 0;
    return Math.round((version.userStats.activeUsersLast7Days / version.userStats.totalUsers) * 100) || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Version Statistics</h3>
        <select
          value={selectedPlatform}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(e) => setSelectedPlatform(e.target.value as any)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md"
        >
          <option value="ALL">All Platforms</option>
          <option value="ANDROID">Android Only</option>
          <option value="IOS">iOS Only</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{filteredVersions.length}</div>
          <div className="text-sm text-gray-600">Total Versions</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{activeVersions.length}</div>
          <div className="text-sm text-gray-600">Active Versions</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{mandatoryVersions.length}</div>
          <div className="text-sm text-gray-600">Mandatory Updates</div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold mb-3">Latest Active Versions</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Android</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                {latestVersions.android ? 'Active' : 'None'}
              </span>
            </div>
            {latestVersions.android ? (
              <>
                <div className="text-2xl font-bold text-gray-800">v{latestVersions.android.version}</div>
                <div className="text-sm text-gray-500">Build {latestVersions.android.buildNumber}</div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Adoption Rate: </span>
                  <span className="font-medium">{calculateAdoptionRate(latestVersions.android)}%</span>
                </div>
              </>
            ) : (
              <div className="text-gray-500 italic">No active Android version</div>
            )}
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">iOS</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {latestVersions.ios ? 'Active' : 'None'}
              </span>
            </div>
            {latestVersions.ios ? (
              <>
                <div className="text-2xl font-bold text-gray-800">v{latestVersions.ios.version}</div>
                <div className="text-sm text-gray-500">Build {latestVersions.ios.buildNumber}</div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Adoption Rate: </span>
                  <span className="font-medium">{calculateAdoptionRate(latestVersions.ios)}%</span>
                </div>
              </>
            ) : (
              <div className="text-gray-500 italic">No active iOS version</div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold mb-3">Version Distribution</h4>
        <div className="space-y-2">
          {filteredVersions
            .filter(v => v.isActive)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map(version => (
              <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    version.platform === 'ANDROID' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <div className="font-medium">{version.platform} v{version.version}</div>
                    <div className="text-sm text-gray-500">
                      {version.userStats?.totalUsers || 0} users • {new Date(version.releaseDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    version.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    version.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {version.priority}
                  </div>
                  {version.isMandatory && (
                    <div className="text-xs text-orange-600 mt-1">Mandatory</div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AppVersionsPage;
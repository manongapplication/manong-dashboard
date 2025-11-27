// pages/Referral-codes-page.tsx
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Search, Plus, User, X } from "lucide-react";
import axios from "axios";
import type { ReferralCode } from "@/types/referral-code";
import StatusAlertDialog from "@/components/ui/status-alert-dialog";
import ReferralCodeCard from "@/components/ui/referral-code-card";
import Modal from "@/components/ui/modal";
import AlertDialog from "@/components/ui/alert-dialog";
import type { AppUser } from "@/types";
import clsx from "clsx";

const ReferralCodesPage: React.FC = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<ReferralCode[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filter, setFilter] = useState<string>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCodeId, setEditingCodeId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deleting, setDeleting] = useState(false);

  // Delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<ReferralCode | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    ownerId: '',
    ownerName: ''
  });

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userSearchQuery.trim()) {
        searchUsers(userSearchQuery);
      } else {
        setSearchResults([]);
        setShowUserDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  const fetchReferralCodes = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      const response = await axios.get(`${baseApiUrl}/referral-code`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 10000,
      });

      if (response.data.success) {
        const codesData = response.data.data;
        setCodes(codesData);
        filterAndSortCodes(codesData, filter, searchQuery, sortOrder);
      } else {
        setCodes([]);
        setFilteredCodes([]);
        setError("Failed to load Referral codes: Invalid response format");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      let errorMessage = "Failed to load Referral codes.";
      
      if (e.code === 'ERR_NETWORK') {
        errorMessage = `Cannot connect to server. Please make sure the backend is running on ${baseApiUrl}`;
      } else if (e.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (e.response?.status === 403) {
        errorMessage = "You don't have permission to access Referral codes.";
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      console.error("Error fetching Referral codes:", e);
      
      setCodes([]);
      setFilteredCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowUserDropdown(false);
      return;
    }

    setSearchingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${baseApiUrl}/user/all?search=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        setSearchResults(response.data.data || []);
        setShowUserDropdown(true);
      } else {
        setSearchResults([]);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('Error searching users:', e);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleUserSelect = (user: AppUser) => {
    setFormData(prev => ({
      ...prev,
      ownerId: user.id.toString(),
      ownerName: `${user.firstName} ${user.lastName}`.trim()
    }));
    setUserSearchQuery('');
    setSearchResults([]);
    setShowUserDropdown(false);
  };

  const clearSelectedUser = () => {
    setFormData(prev => ({
      ...prev,
      ownerId: '',
      ownerName: ''
    }));
    setUserSearchQuery('');
  };

  const filterAndSortCodes = (
    codesData: ReferralCode[], 
    currentFilter: string,
    currentSearchQuery: string, 
    currentSortOrder: 'newest' | 'oldest'
  ) => {
    let filtered = [...codesData];

    // Apply filter
    if (currentFilter === 'withUsages') {
      filtered = filtered.filter(code => (code.usages?.length || 0) > 0);
    } else if (currentFilter === 'noUsages') {
      filtered = filtered.filter(code => (code.usages?.length || 0) === 0);
    } else if (currentFilter === 'highUsage') {
      filtered = filtered.filter(code => (code.usages?.length || 0) >= 5);
    }

    // Apply search filter
    if (currentSearchQuery.trim()) {
      filtered = filtered.filter(code => 
        code.code.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        code.owner?.firstName?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        code.owner?.lastName?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        code.owner?.email?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        code.owner?.phone?.includes(currentSearchQuery) ||
        code.id.toString().includes(currentSearchQuery)
      );
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return currentSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredCodes(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterAndSortCodes(codes, filter, query, sortOrder);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    filterAndSortCodes(codes, newFilter, searchQuery, sortOrder);
  };

  const handleSortChange = (newSortOrder: 'newest' | 'oldest') => {
    setSortOrder(newSortOrder);
    filterAndSortCodes(codes, filter, searchQuery, newSortOrder);
  };

  const handleCreateCode = async () => {
    if (!formData.code.trim() || !formData.ownerId.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please log in.");
        setCreating(false);
        return;
      }

      const response = await axios.post(
        `${baseApiUrl}/referral-code`,
        {
          code: formData.code.trim(),
          ownerId: parseInt(formData.ownerId)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        setSuccessMessage('Referral code created successfully!');
        setIsModalOpen(false);
        resetForm();
        await fetchReferralCodes(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to create code');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to create Referral code. Please try again.';
      setError(errorMessage);
      console.error('Error creating Referral code:', e);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCode = async () => {
    if (!formData.code.trim() || !formData.ownerId.trim() || !editingCodeId) {
      setError("Please fill in all required fields");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please log in.");
        setCreating(false);
        return;
      }

      const response = await axios.put(
        `${baseApiUrl}/referral-code/${editingCodeId}`,
        {
          code: formData.code.trim(),
          ownerId: parseInt(formData.ownerId)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        setSuccessMessage('Referral code updated successfully!');
        setIsModalOpen(false);
        resetForm();
        await fetchReferralCodes(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to update code');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update Referral code. Please try again.';
      setError(errorMessage);
      console.error('Error updating Referral code:', e);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!codeToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please log in.");
        setDeleting(false);
        return;
      }

      const response = await axios.delete(
        `${baseApiUrl}/referral-code/${codeToDelete.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        setSuccessMessage('Referral code deleted successfully!');
        setIsDeleteDialogOpen(false);
        setCodeToDelete(null);
        await fetchReferralCodes(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to delete code');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to delete Referral code. Please try again.';
      setError(errorMessage);
      console.error('Error deleting Referral code:', e);
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccessMessage('Code copied to clipboard!');
    }).catch(() => {
      setError('Failed to copy to clipboard');
    });
  };

  const resetForm = () => {
    setFormData({ code: '', ownerId: '', ownerName: '' });
    setUserSearchQuery('');
    setSearchResults([]);
    setShowUserDropdown(false);
    setIsEditMode(false);
    setEditingCodeId(null);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingCodeId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Function to fetch all users
  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${baseApiUrl}/user/all?limit=1000`, // Adjust limit as needed
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        setAllUsers(response.data.data || []);
        setUsersLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  // Update openEditModal to use cached users
  const openEditModal = (code: ReferralCode) => {
    setIsEditMode(true);
    setEditingCodeId(code.id);
    
    // Find the owner in cached users
    const owner = allUsers.find(user => user.id === code.ownerId);
    const ownerName = owner 
      ? `${owner.firstName} ${owner.lastName}`.trim()
      : (code.owner && code.owner.firstName 
          ? `${code.owner.firstName} ${code.owner.lastName || ''}`.trim()
          : `User ${code.ownerId}`);
    
    setFormData({
      code: code.code,
      ownerId: code.ownerId.toString(),
      ownerName: ownerName
    });
    
    setUserSearchQuery('');
    setSearchResults([]);
    setShowUserDropdown(false);
    setIsModalOpen(true);
  };

  // Fetch all users on component mount
  useEffect(() => {
    fetchReferralCodes();
    fetchAllUsers(); // Fetch users when component loads
  }, []);

  const openDeleteDialog = (code: ReferralCode) => {
    setCodeToDelete(code);
    setIsDeleteDialogOpen(true);
  };

  const getModalTitle = () => {
    return isEditMode ? 'Edit Referral Code' : 'Create Referral Code';
  };

  const getSubmitButtonText = () => {
    if (creating) return 'Saving...';
    return isEditMode ? 'Update Code' : 'Create Code';
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-slate-400 text-6xl mb-4">🎯</div>
      <h3 className="text-lg font-medium text-slate-600 mb-2">
        {searchQuery.trim() ? "No codes found matching your search" : "No Referral codes found"}
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        {error ? "There was an error loading Referral codes." : "Get started by creating your first Referral code."}
      </p>
      {error && (
        <button
          onClick={fetchReferralCodes}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
      {!error && (
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} className="inline mr-2" />
          Create First Code
        </button>
      )}
      {searchQuery.trim() && (
        <button
          onClick={() => handleSearch('')}
          className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
        >
          Clear search
        </button>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Referral Codes - Admin Dashboard</title>
        <meta name="description" content="Manage Referral referral codes and track their usage." />
      </Helmet>

      <div className="flex flex-col items-center w-full justify-center gap-4 mt-4 px-5 sm:px-20 pb-10">
        {/* Header */}
        <div className="text-center mt-4 max-w-3xl">
          <h1 className="text-2xl font-semibold">
            Referral Codes
          </h1>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-gray-600">
            Create and manage Referral referral codes. Track usage and monitor which Referrals 
            are driving the most signups to your platform.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-6xl mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={
                isEditMode && formData.ownerId 
                  ? `Current: ${formData.ownerName} (ID: ${formData.ownerId}) - Search for new Referral...`
                  : "Search for Referral by name, email, or phone..."
              }
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons and Filters */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 w-full max-w-6xl">
          {/* Filters and Sort */}
          <div className="flex flex-row gap-2">
            <select 
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="select"
            >
              <option value="all">All Codes</option>
              <option value="withUsages">With Usages</option>
              <option value="noUsages">No Usages</option>
              <option value="highUsage">High Usage (5+)</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => handleSortChange(e.target.value as 'newest' | 'oldest')}
              className="select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button 
              type="button" 
              className="btn btn-sm sm:btn-md bg-green-600 hover:bg-green-700"
              onClick={openCreateModal}
            >
              <Plus size={16} className="inline mr-2" />
              Create Code
            </button>
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery.trim() && (
          <div className="w-full max-w-6xl">
            <p className="text-sm text-gray-600">
              Found {filteredCodes.length} code(s) matching "{searchQuery}"
            </p>
          </div>
        )}

        {/* Codes Summary */}
        {!loading && codes.length > 0 && (
          <div className="w-full max-w-6xl p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Codes Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-blue-600">{codes.length}</div>
                <div className="text-gray-600">Total Codes</div>
              </div>
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-green-600">
                  {codes.reduce((total, code) => total + (code.usages?.length || 0), 0)}
                </div>
                <div className="text-gray-600">Total Usages</div>
              </div>
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(codes.map(code => code.ownerId)).size}
                </div>
                <div className="text-gray-600">Unique Referrals</div>
              </div>
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-orange-600">
                  {codes.filter(code => (code.usages?.length || 0) > 0).length}
                </div>
                <div className="text-gray-600">Active Codes</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading Referral codes...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <EmptyState />
        ) : (
          /* Codes Grid - Using Card Layout */
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
            {filteredCodes.map((code) => (
              <ReferralCodeCard
                key={code.id}
                code={code}
                onCopyCode={copyToClipboard}
                onEdit={openEditModal}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal for Create/Edit Code */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={getModalTitle()}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                code: e.target.value.toUpperCase() 
              }))}
              placeholder="Enter unique code (e.g., MANGO25)"
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be the referral code that users enter
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Referral *</label>
            
            {/* Selected User Display */}
            {formData.ownerName ? (
              <div className="flex items-center justify-between p-3 border border-gray-700 rounded-md">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="font-medium">{formData.ownerName}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">(ID: {formData.ownerId})</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedUser}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              /* User Search Input with Owner ID in placeholder for edit mode */
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUserSearchQuery(value);
                      searchUsers(value);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    placeholder={
                      isEditMode && formData.ownerId 
                        ? `Current Owner ID: ${formData.ownerId} - Search for new Referral...`
                        : "Search for Referral by name, email, or phone..."
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchingUsers && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>

                {/* User Search Results Dropdown */}
                {showUserDropdown && (
                  <div className={clsx(localStorage.getItem('theme') == 'dark' ? "bg-gray-800" : "bg-white", "absolute z-10 w-full mt-1 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto")}>
                    {searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="cursor-pointer w-full px-4 py-3 text-left border-b border-gray-700 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email} • {user.phone}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                ID: {user.id} • {user.role}
                              </div>
                            </div>
                            <User size={16} className="text-gray-400 ml-2" />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        {userSearchQuery.trim() ? 'No users found' : 'Start typing to search users'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {isEditMode && formData.ownerId 
                ? `Current Owner: ${formData.ownerName} (ID: ${formData.ownerId}) - Search to change Referral`
                : 'Search and select the Referral who will own this code'
              }
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={isEditMode ? handleUpdateCode : handleCreateCode}
              disabled={creating || !formData.code.trim() || !formData.ownerId.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getSubmitButtonText()}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Referral Code"
        message={`Are you sure you want to delete the code "${codeToDelete?.code}"? This action cannot be undone and will remove all associated usage data.`}
        onConfirm={handleDeleteCode}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setCodeToDelete(null);
        }}
      />

      {/* Success Dialog */}
      {successMessage && (
        <StatusAlertDialog
          isOpen={true}
          type="success"
          title="Success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Error Dialog */}
      {error && (
        <StatusAlertDialog
          isOpen={true}
          type="error"
          title="Something went wrong"
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </>
  );
};

export default ReferralCodesPage;
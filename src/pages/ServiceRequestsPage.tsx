import { useState, useEffect, type ReactNode } from "react";
import { 
  Clock, Users, ChevronLeft, ChevronRight, Search, 
  CheckCircle, XCircle, Play, Loader, Calendar, DollarSign,
  AlertCircle, Ban, Trash2, RefreshCw,
  X,
  Maximize2,
} from "lucide-react";
import axios from "axios";
import StatsCard from "@/components/ui/stats-card";
import type { ServiceRequest } from "@/types";
import Modal from "@/components/ui/modal";
import clsx from "clsx";
import ServiceRequestCard from "@/components/ui/service-request-card";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";

export interface UpdateServiceRequestForm {
  status?: string;
  manongId?: number;
  notes?: string;
  total?: number;
  paymentStatus?: string;
}

const ServiceRequestsPage = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [filteredServiceRequests, setFilteredServiceRequests] = useState<ServiceRequest[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalContent, setModalContent] = useState<ReactNode>(<></>);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);

  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    failed: 0,
    awaitingAcceptance: 0,
    refunding: 0,
    expired: 0,
    rejected: 0,
    totalRevenue: 0,
    averageCompletionTime: 0,
  });

  const tabs = [
    { label: "All", count: stats.total, status: null },
    { label: "Awaiting", count: stats.awaitingAcceptance, status: "awaitingAcceptance" },
    { label: "Pending", count: stats.pending, status: "pending" },
    { label: "Accepted", count: stats.accepted, status: "accepted" },
    { label: "In Progress", count: stats.inProgress, status: "inProgress" },
    { label: "Completed", count: stats.completed, status: "completed" },
    { label: "Cancelled", count: stats.cancelled, status: "cancelled" },
    { label: "Failed", count: stats.failed, status: "failed" },
    { label: "Refunding", count: stats.refunding, status: "refunding" },
    { label: "Expired", count: stats.expired, status: "expired" },
    { label: "Rejected", count: stats.rejected, status: "rejected" },
  ];

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [imageList, setImageList] = useState<string[]>([]);
  const [detailsModalClosedByImage, setDetailsModalClosedByImage] = useState(false);

  const fetchServiceRequests = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add search if exists
      if (searchQuery.trim()) {
        params.append('search', searchQuery);
      }

      // Add status filter if not "All"
      const selectedTab = tabs[selectedTabIndex];
      if (selectedTab.status) {
        params.append('status', selectedTab.status);
      }

      // Add date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let dateFrom: Date | undefined;
        
        switch (dateFilter) {
          case 'today':
            { const today = new Date();
            today.setHours(0, 0, 0, 0);
            dateFrom = today;
            break; }
          case 'week':
            { const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            dateFrom = weekAgo;
            break; }
          case 'month':
            { const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            dateFrom = monthAgo;
            break; }
        }
        
        if (dateFrom) {
          params.append('dateFrom', dateFrom.toISOString());
        }
      }

      // Add amount filters
      if (minAmount) {
        params.append('minAmount', minAmount);
      }
      if (maxAmount) {
        params.append('maxAmount', maxAmount);
      }

      const response = await axios.get(
        `${baseApiUrl}/service-requests/admin/all?${params.toString()}`,
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
        const pagination = response.data.pagination;
        
        setServiceRequests(data);
        setFilteredServiceRequests(data);
        
        setTotalPages(pagination.totalPages || 1);
        setTotalCount(pagination.totalCount || data.length || 0);
        setCurrentPage(page);
        
        await fetchStats();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching service requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch service requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${baseApiUrl}/service-requests/admin/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const filterByDate = (requests: ServiceRequest[]) => {
    if (dateFilter === 'all') return requests;
    
    const filtered = requests.filter(request => {
      if (!request.createdAt) return false;
      
      const requestDate = new Date(request.createdAt);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          return requestDate.toDateString() === today.toDateString();
        case 'week':
          { const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          return requestDate >= weekAgo; }
        case 'month':
          { const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          return requestDate >= monthAgo; }
        default:
          return true;
      }
    });
    
    return filtered;
  };

  const filterByAmount = (requests: ServiceRequest[]) => {
    let filtered = requests;
    
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(r => (r.total || 0) >= min);
      }
    }
    
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(r => (r.total || 0) <= max);
      }
    }
    
    return filtered;
  };

  const applyFiltersAndSorting = (requests: ServiceRequest[]) => {
    let filtered = requests;
    const selectedTab = tabs[selectedTabIndex];
    
    if (selectedTab.status) {
      filtered = filtered.filter(r => r.status === selectedTab.status);
    }
    
    filtered = filterByDate(filtered);
    filtered = filterByAmount(filtered);
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(request => 
        request.requestNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.customerFullAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.manong?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.manong?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.user?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.manong?.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt!).getTime();
      const dateB = new Date(b.createdAt!).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredServiceRequests(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    applyFiltersAndSorting(serviceRequests);
  };

  useEffect(() => {
    applyFiltersAndSorting(serviceRequests);
  }, [selectedTabIndex, dateFilter, sortOrder, minAmount, maxAmount, serviceRequests]);

  const handleUpdateServiceRequest = async (id: number, data: UpdateServiceRequestForm) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${baseApiUrl}/service-requests/admin/${id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      await fetchServiceRequests(currentPage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error updating service request:', err);
      setError(err.response?.data?.message || 'Failed to update service request');
      throw err;
    }
  };

  // Function to handle image click
  const handleImageClick = (imageUrl: string, images: string[], index: number) => {
    setSelectedImage(imageUrl);
    setImageList(images);
    setSelectedImageIndex(index);
    
    // Close the details modal first
    setIsModalOpen(false);
    setDetailsModalClosedByImage(true);
    
    // Open image modal with high z-index
    setTimeout(() => {
      setImageModalOpen(true);
    }, 50);
  };

  // Function to navigate between images
  const handleNextImage = () => {
    if (imageList.length === 0) return;
    const nextIndex = (selectedImageIndex + 1) % imageList.length;
    setSelectedImageIndex(nextIndex);
    setSelectedImage(imageList[nextIndex]);
  };

  const handlePrevImage = () => {
    if (imageList.length === 0) return;
    const prevIndex = (selectedImageIndex - 1 + imageList.length) % imageList.length;
    setSelectedImageIndex(prevIndex);
    setSelectedImage(imageList[prevIndex]);
  };

  // Handle image modal close
  const handleImageModalClose = () => {
    setImageModalOpen(false);
    
    // Reopen details modal if it was closed by clicking an image
    if (detailsModalClosedByImage) {
      setTimeout(() => {
        setIsModalOpen(true);
        setDetailsModalClosedByImage(false);
      }, 50);
    }
  };

  const handleViewDetails = (request: ServiceRequest) => {
    setIsModalOpen(true); 
    setModalTitle(`Service Request Details - ${request.requestNumber}`); 
    
    const totalAmount = typeof request.total === 'string' 
      ? parseFloat(request.total) 
      : request.total || 0;
    
    const images = Array.isArray(request.imagesPath) 
      ? request.imagesPath 
      : typeof request.imagesPath === 'string'
        ? JSON.parse(request.imagesPath) || []
        : [];
    
    setModalContent(
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Info */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Customer Information</h3>
            <div className="space-y-1">
              <p className="font-medium">
                {request.user?.firstName} {request.user?.lastName}
              </p>
              <p className="text-sm text-slate-500">{request.user?.phone}</p>
              {request.user?.email && (
                <p className="text-sm text-slate-500">{request.user.email}</p>
              )}
            </div>
          </div>
          
          {/* Manong Info */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Manong Information</h3>
            <div className="space-y-1">
              <p className="font-medium">
                {request.manong ? `${request.manong.firstName} ${request.manong.lastName}` : 'Not assigned'}
              </p>
              {request.manong?.phone && (
                <p className="text-sm text-slate-500">{request.manong.phone}</p>
              )}
              {request.manong?.email && (
                <p className="text-sm text-slate-500">{request.manong.email}</p>
              )}
            </div>
          </div>
          
          {/* Service Details */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Service Details</h3>
            <div className="space-y-1">
              <p className="font-medium">
                {request.serviceItem?.title || 'Unknown Service'}
                {request.subServiceItem && ` → ${request.subServiceItem.title}`}
              </p>
              {request.otherServiceName && (
                <p className="text-sm text-slate-500 italic">
                  Custom: {request.otherServiceName}
                </p>
              )}
              {request.serviceDetails && (
                <div className="mt-2">
                  <p className="text-sm text-slate-700 font-medium">Description:</p>
                  <p className="text-sm text-slate-600 mt-1">{request.serviceDetails}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Financial Details */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Financial Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">
                  ₱{totalAmount.toFixed(2)}
                </span>
                {request.paymentMethod?.name && (
                  <span className="text-sm text-slate-500">
                    ({request.paymentMethod.name})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                  Payment: {request.paymentStatus || 'unpaid'}
                </span>
                {request.urgencyLevel?.level && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    {request.urgencyLevel.level}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-slate-700 mb-2">Location</h3>
            <div className="p-3 rounded-lg">
              <p className="text-sm">{request.customerFullAddress || "No address provided"}</p>
              <p className="text-xs text-slate-500 mt-1">
                Coordinates: {request.customerLat}, {request.customerLng}
              </p>
            </div>
          </div>
          
          {/* Request Info */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Request Info</h3>
            <div className="space-y-1 text-sm">
              <p>Status: <span className="font-medium">{request.status || 'N/A'}</span></p>
              <p>Created: <span className="font-medium">
                {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}
              </span></p>
              {request.acceptedAt && (
                <p>Accepted: <span className="font-medium">
                  {new Date(request.acceptedAt).toLocaleString()}
                </span></p>
              )}
            </div>
          </div>
        </div>
        
        {/* Images - UPDATED with clickable functionality */}
        {images.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Uploaded Images</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image: string, index: number) => {
                const imageUrl = image.startsWith('http') 
                  ? image 
                  : `${baseUrl}/${image}`;
                
                return (
                  <div 
                    key={index} 
                    className="shrink-0 relative group cursor-pointer"
                    onClick={() => handleImageClick(imageUrl, images, index)}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 size={16} className="text-white bg-black bg-opacity-50 p-1 rounded" />
                    </div>
                    <img 
                      src={imageUrl}
                      alt={`Service image ${index + 1}`}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/128x128?text=Image+Not+Found';
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Click on an image to view it full screen
            </p>
          </div>
        )}
        
        {/* Payment Transactions */}
        {request.paymentTransactions && request.paymentTransactions.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-slate-700 mb-2">Payment Transactions</h3>
            <div className="space-y-2">
              {request.paymentTransactions.map((transaction, index) => (
                <div key={index} className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">₱{typeof transaction.amount === 'string' 
                        ? parseFloat(transaction.amount).toFixed(2) 
                        : transaction.amount.toFixed(2)}</p>
                      <p className="text-sm text-slate-500">
                        {transaction.provider} • {transaction.status}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchServiceRequests(1);
  }, []);

  const handleTabChange = (index: number) => {
    setSelectedTabIndex(index);
    setCurrentPage(1);
    setSelectedItems(new Set());
    applyFiltersAndSorting(serviceRequests);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchServiceRequests(newPage);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredServiceRequests.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredServiceRequests.map(r => r.id)));
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
    const confirmDelete = window.confirm('Are you sure you want to delete this service request?');
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const response = await axios.delete(
        `${baseApiUrl}/service-requests/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      if (response.data?.success) {
        await fetchServiceRequests(currentPage);
        await fetchStats();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error deleting service request:', err);
      setError(err.response?.data?.message || 'Failed to delete service request');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const confirmDelete = window.confirm(`Delete ${selectedItems.size} service request(s)?`);
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const ids = Array.from(selectedItems);

      const response = await axios.post(
        `${baseApiUrl}/service-requests/bulk-delete`,
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
        await fetchServiceRequests(currentPage);
        await fetchStats();
        setSelectedItems(new Set());
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error bulk deleting service requests:', err);
      setError(err.response?.data?.message || 'Failed to delete selected service requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchServiceRequests(currentPage);
  };

  const navigate = useNavigate();
  const handleViewReport = (request: ServiceRequest) => {
    // Navigate to Manong Reports page with the request number in query params
    navigate(`/manong-reports?search=${encodeURIComponent(request.requestNumber)}`);
  };

  return (
    <>
      <Helmet>
        <title>Service Request Management - Manong Admin</title>
        <meta
          name="description"
          content="Manage all service requests in the Manong admin dashboard. Track requests, assign providers, monitor progress, and handle payments."
        />
      </Helmet>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with refresh button */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Service Requests</h1>
              <p className="text-slate-600">Manage and monitor all service requests</p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Refresh
                </>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              title="Total Requests" 
              value={stats.total} 
              Icon={Users} 
            />
            <StatsCard
              title="Total Revenue"
              value={stats.totalRevenue}
              Icon={DollarSign}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatsCard
              title="Active Requests"
              value={stats.accepted + stats.inProgress + stats.pending}
              Icon={Play}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatsCard
              title="Avg. Completion"
              value={stats.averageCompletionTime}
              Icon={Clock}
              color="text-purple-600"
              bgColor="bg-purple-100"
            />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-orange-600" />
                <span className="text-sm text-orange-700">Awaiting</span>
              </div>
              <p className="text-xl font-bold text-orange-800">{stats.awaitingAcceptance}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader size={16} className="text-yellow-600" />
                <span className="text-sm text-yellow-700">In Progress</span>
              </div>
              <p className="text-xl font-bold text-yellow-800">{stats.inProgress}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm text-green-700">Completed</span>
              </div>
              <p className="text-xl font-bold text-green-800">{stats.completed}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-600" />
                <span className="text-sm text-red-700">Cancelled</span>
              </div>
              <p className="text-xl font-bold text-red-800">{stats.cancelled}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Ban size={16} className="text-purple-600" />
                <span className="text-sm text-purple-700">Failed</span>
              </div>
              <p className="text-xl font-bold text-purple-800">{stats.failed}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-blue-600" />
                <span className="text-sm text-blue-700">Refunding</span>
              </div>
              <p className="text-xl font-bold text-blue-800">{stats.refunding}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Tabs and Table Container */}
          <div className={clsx(
            localStorage.getItem("theme") === 'dark' ? "border-slate-600" : "bg-white border-slate-200",
            "rounded-xl shadow-sm border overflow-hidden"
          )}>
            {/* Search and Filters Bar */}
            <div className="p-6 border-b border-slate-200 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by request number, customer, manong, phone, or address..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Date Filter */}
                <select
                  value={dateFilter}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="px-3 py-2 select w-32"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                {/* Amount Range */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min Amount"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max Amount"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 px-6">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => handleTabChange(index)}
                    className={`py-3 px-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                      selectedTabIndex === index
                        ? "text-blue-600"
                        : "text-slate-400 hover:text-slate-900"
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

            {/* Table - Card Layout */}
            <div className="p-6">
              {/* Select All and Sort */}
              {filteredServiceRequests.length > 0 && (
                <div className="mb-4 flex justify-between items-center gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === filteredServiceRequests.length && filteredServiceRequests.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">
                        {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
                      </span>
                    </div>
                    {selectedItems.size > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                        Delete Selected ({selectedItems.size})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600">
                      Showing {filteredServiceRequests.length} of {serviceRequests.length} requests
                    </span>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                      className="px-3 py-2 w-32 select"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && filteredServiceRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-slate-600">Loading service requests...</p>
                </div>
              ) : (
                <>
                  {/* Service Requests List */}
                  <div className="space-y-4">
                    {filteredServiceRequests.map((request) => (
                      <ServiceRequestCard
                        key={request.id}
                        request={request}
                        isSelected={selectedItems.has(request.id)}
                        onToggleSelect={toggleSelectItem}
                        onDelete={handleDelete}
                        onUpdate={handleUpdateServiceRequest}
                        onViewDetails={handleViewDetails}
                        onViewReport={handleViewReport}
                        isDark={localStorage.getItem("theme") === 'dark'}
                      />
                    ))}
                  </div>

                  {/* Search Results Info */}
                  {searchQuery.trim() && filteredServiceRequests.length > 0 && (
                    <div className="mt-4 text-sm text-slate-600">
                      Found {filteredServiceRequests.length} request(s) matching "{searchQuery}"
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
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
              {!loading && filteredServiceRequests.length === 0 && (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    {searchQuery.trim() ? "No service requests found matching your search" : "No service requests found"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedTabIndex > 0 ? "No service requests with this status" : "Try adjusting your filters or check back later"}
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

        {/* Image Modal with high z-index */}
        <div className="relative z-[99999]">
          <Modal
            isOpen={imageModalOpen}
            onClose={handleImageModalClose}
            title=""
            className="z-[99999]"
          >
            <div className="relative w-full h-[85vh] flex items-center justify-center bg-black">
              {/* Close button */}
              <button
                onClick={handleImageModalClose}
                className="absolute top-4 right-4 z-50 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              >
                <X size={24} />
              </button>
              
              {/* Navigation buttons */}
              {imageList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              
              {/* Image counter */}
              {imageList.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-full">
                  {selectedImageIndex + 1} / {imageList.length}
                </div>
              )}
              
              {/* Image container with centering fix */}
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={selectedImage}
                  alt={`Service image ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                  }}
                />
              </div>
            </div>
          </Modal>
        </div>

        {/* Service Request Details Modal */}
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

export default ServiceRequestsPage;
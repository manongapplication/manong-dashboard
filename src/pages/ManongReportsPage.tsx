import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Search } from "lucide-react";
import axios from "axios";
import type { ManongReport } from "@/types/manong-report";
import StatusAlertDialog from "@/components/ui/status-alert-dialog";
import clsx from "clsx";
import ManongReportCard from "@/components/ui/manong-report-card";

const ManongReportsPage: React.FC = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ManongReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ManongReport[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<ManongReport[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const fetchManongReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      const response = await axios.get(`${baseApiUrl}/manong-report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 10000,
      });

      if (response.data.success) {
        const reportsData = response.data.data;
        setReports(reportsData);
        setOriginalData(JSON.parse(JSON.stringify(reportsData)));
        filterAndSortReports(reportsData, filter, searchQuery, sortOrder);
      } else {
        setReports([]);
        setFilteredReports([]);
        setOriginalData([]);
        setError("Failed to load manong reports: Invalid response format");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      let errorMessage = "Failed to load manong reports.";
      
      if (e.code === 'ERR_NETWORK') {
        errorMessage = `Cannot connect to server. Please make sure the backend is running on ${baseApiUrl}`;
      } else if (e.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (e.response?.status === 403) {
        errorMessage = "You don't have permission to access manong reports.";
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      console.error("Error fetching manong reports:", e);
      
      setReports([]);
      setFilteredReports([]);
      setOriginalData([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortReports = (
    reportsData: ManongReport[], 
    currentFilter: string, 
    currentSearchQuery: string, 
    currentSortOrder: 'newest' | 'oldest'
  ) => {
    let filtered = [...reportsData];

    // Apply filter
    if (currentFilter === 'paid') {
      filtered = filtered.filter(report => report.serviceRequest?.paymentStatus === 'paid');
    } else if (currentFilter === 'unpaid') {
      filtered = filtered.filter(report => 
        report.serviceRequest?.paymentStatus === 'unpaid' || 
        report.serviceRequest?.paymentStatus === 'pending'
      );
    } else if (currentFilter === 'completed') {
      filtered = filtered.filter(report => report.serviceRequest?.status === 'completed');
    } else if (currentFilter === 'withIssues') {
      filtered = filtered.filter(report => report.issuesFound && report.issuesFound.length > 0);
    } else if (currentFilter === 'verified') {
      filtered = filtered.filter(report => report.verifiedByUser === true);
    } else if (currentFilter === 'customerPresent') {
      filtered = filtered.filter(report => report.customerPresent === true);
    }

    // Apply search filter
    if (currentSearchQuery.trim()) {
      filtered = filtered.filter(report => 
        report.summary?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        report.details?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        report.materialsUsed?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        report.issuesFound?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        report.recommendations?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        report.warrantyInfo?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        report.serviceRequest?.requestNumber?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        (report.manong && 
          `${report.manong.firstName} ${report.manong.lastName}`.toLowerCase().includes(currentSearchQuery.toLowerCase())
        ) ||
        (report.serviceRequest?.user && 
          `${report.serviceRequest.user.firstName} ${report.serviceRequest.user.lastName}`.toLowerCase().includes(currentSearchQuery.toLowerCase())
        ) ||
        report.id.toString().includes(currentSearchQuery)
      );
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return currentSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredReports(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterAndSortReports(reports, filter, query, sortOrder);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    filterAndSortReports(reports, newFilter, searchQuery, sortOrder);
  };

  const handleSortChange = (newSortOrder: 'newest' | 'oldest') => {
    setSortOrder(newSortOrder);
    filterAndSortReports(reports, filter, searchQuery, newSortOrder);
  };

  useEffect(() => {
    fetchManongReports();
  }, []);

  const handleEditingClick = () => {
    if (isEditing && hasChanges) {
      const confirmCancel = window.confirm(
        "You have unsaved changes. Are you sure you want to cancel editing?"
      );
      if (confirmCancel) {
        setIsEditing(false);
        resetToOriginal();
      }
    } else {
      setIsEditing(prev => !prev);
    }
  }

  const handleReportChange = (id: number, updatedData: Partial<ManongReport>) => {
    const updatedReports = reports.map(report => 
      report.id === id ? { ...report, ...updatedData } : report
    );
    setReports(updatedReports);
    filterAndSortReports(updatedReports, filter, searchQuery, sortOrder);
    setHasChanges(true);
  }

  const handleSaveReport = async (report: ManongReport) => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please log in.");
        setSaving(false);
        return;
      }

      const formData = new FormData();
      
      // Append all fields
      formData.append('summary', report.summary);
      if (report.details) formData.append('details', report.details);
      if (report.materialsUsed) formData.append('materialsUsed', report.materialsUsed);
      if (report.laborDuration) formData.append('laborDuration', report.laborDuration.toString());
      if (report.issuesFound) formData.append('issuesFound', report.issuesFound);
      if (report.customerPresent !== undefined) formData.append('customerPresent', report!.customerPresent!.toString());
      if (report.totalCost) formData.append('totalCost', report.totalCost.toString());
      if (report.warrantyInfo) formData.append('warrantyInfo', report.warrantyInfo);
      if (report.recommendations) formData.append('recommendations', report.recommendations);

      const response = await axios.post(
        `${baseApiUrl}/manong-report/${report.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
            'ngrok-skip-browser-warning': 'true'
          },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        setSuccessMessage('Manong report updated successfully!');
        setHasChanges(false);
        await fetchManongReports(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to update report');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update manong report. Please try again.';
      setError(errorMessage);
      console.error('Error updating manong report:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAllReports = async () => {
    if (!hasChanges) return;

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please log in.");
        setSaving(false);
        return;
      }

      // Update each report that has changes
      const updatePromises = reports.map(async (report) => {
        const originalReport = originalData.find(orig => orig.id === report.id);
        
        if (originalReport && (
          report.summary !== originalReport.summary ||
          report.details !== originalReport.details ||
          report.materialsUsed !== originalReport.materialsUsed ||
          report.laborDuration !== originalReport.laborDuration ||
          report.issuesFound !== originalReport.issuesFound ||
          report.customerPresent !== originalReport.customerPresent ||
          report.totalCost !== originalReport.totalCost ||
          report.warrantyInfo !== originalReport.warrantyInfo ||
          report.recommendations !== originalReport.recommendations
        )) {
          const formData = new FormData();
          
          formData.append('summary', report.summary);
          if (report.details) formData.append('details', report.details);
          if (report.materialsUsed) formData.append('materialsUsed', report.materialsUsed);
          if (report.laborDuration) formData.append('laborDuration', report.laborDuration.toString());
          if (report.issuesFound) formData.append('issuesFound', report.issuesFound);
          if (report.customerPresent !== undefined) formData.append('customerPresent', report!.customerPresent!.toString());
          if (report.totalCost) formData.append('totalCost', report.totalCost.toString());
          if (report.warrantyInfo) formData.append('warrantyInfo', report.warrantyInfo);
          if (report.recommendations) formData.append('recommendations', report.recommendations);

          return axios.post(
            `${baseApiUrl}/manong-report/${report.id}`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
                'ngrok-skip-browser-warning': 'true'
              },
              timeout: 15000,
            }
          );
        }
        return Promise.resolve(null);
      });

      const validPromises = updatePromises.filter(promise => promise !== null);
      const results = await Promise.all(validPromises);
      
      const failedUpdates = results.filter(result => result && result.status !== 200 && result.status !== 201);
      
      if (failedUpdates.length === 0) {
        setSuccessMessage('All manong reports updated successfully!');
        setHasChanges(false);
        setIsEditing(false);
        await fetchManongReports();
      } else {
        throw new Error(`${failedUpdates.length} updates failed`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update manong reports. Please try again.';
      setError(errorMessage);
      console.error('Error updating manong reports:', e);
    } finally {
      setSaving(false);
    }
  };

  const resetToOriginal = () => {
    setReports(JSON.parse(JSON.stringify(originalData)));
    filterAndSortReports(JSON.parse(JSON.stringify(originalData)), filter, searchQuery, sortOrder);
    setHasChanges(false);
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-slate-400 text-6xl mb-4">📋</div>
      <h3 className="text-lg font-medium text-slate-600 mb-2">
        {searchQuery.trim() ? "No reports found matching your search" : "No manong reports found"}
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        {error ? "There was an error loading manong reports." : "There are no manong reports to display."}
      </p>
      {error && (
        <button
          onClick={fetchManongReports}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
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
        <title>Manong Reports - Admin Dashboard</title>
        <meta name="description" content="Manage and view all manong service reports." />
      </Helmet>

      <div className="flex flex-col items-center w-full justify-center gap-4 mt-4 px-5 sm:px-20 pb-10">
        {/* Header */}
        <div className="text-center mt-4 max-w-3xl">
          <h1 className="text-2xl font-semibold">
            Manong Service Reports
          </h1>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-gray-600">
            Monitor and manage all service reports submitted by Manongs. Each report contains 
            detailed information about completed services, including materials used, costs, 
            and customer interactions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-6xl mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search reports by summary, details, materials, issues, names, or ID..."
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
              <option value="all">All Reports</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="completed">Completed</option>
              <option value="withIssues">With Issues</option>
              <option value="verified">Customer Verified</option>
              <option value="customerPresent">Customer Present</option>
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
            {hasChanges && (
              <button 
                type="button" 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handleUpdateAllReports}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            )}
            <button 
              type="button" 
              className={clsx(
                "btn btn-sm sm:btn-md",
                isEditing && "bg-yellow-600! hover:bg-yellow-700!"
              )}
              onClick={handleEditingClick}
              disabled={saving || reports.length === 0}
            >
              {isEditing ? 'Cancel Edit' : 'Manage Reports'}
            </button>
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery.trim() && (
          <div className="w-full max-w-6xl">
            <p className="text-sm text-gray-600">
              Found {filteredReports.length} report(s) matching "{searchQuery}"
            </p>
          </div>
        )}

        {/* Unsaved Changes Alert */}
        {hasChanges && (
          <div className="w-full max-w-6xl p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              ⚠️ You have unsaved changes. Don't forget to save!
            </p>
          </div>
        )}

        {/* Reports Summary */}
        {!loading && reports.length > 0 && (
          <div className="w-full max-w-6xl p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Reports Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
                <div className="text-gray-600">Total Reports</div>
              </div>
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-green-600">
                  {reports.filter(r => r.serviceRequest?.paymentStatus === 'paid').length}
                </div>
                <div className="text-gray-600">Paid Services</div>
              </div>
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-orange-600">
                  {reports.filter(r => r.issuesFound && r.issuesFound.length > 0).length}
                </div>
                <div className="text-gray-600">With Issues</div>
              </div>
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-purple-600">
                  {reports.filter(r => r.customerPresent).length}
                </div>
                <div className="text-gray-600">Customer Present</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading manong reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState />
        ) : (
          /* Reports Grid */
          <div className="w-full max-w-7xl space-y-6 mt-6">
            {filteredReports.map((report) => (
              <ManongReportCard
                key={report.id}
                report={report}
                onUpdate={handleReportChange}
                onSave={handleSaveReport}
                isEditing={isEditing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Success Dialog */}
      {successMessage && (
        <StatusAlertDialog
          isOpen={true}
          type="success"
          title="Update Successful"
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

export default ManongReportsPage;
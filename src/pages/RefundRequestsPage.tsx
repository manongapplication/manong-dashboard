import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import axios from "axios";
import type { RefundRequest } from "@/types/refund-request";
import RefundRequestCard from '@/components/ui/refund-request-card';
import StatusAlertDialog from "@/components/ui/status-alert-dialog";
import clsx from "clsx";
import type { RefundStatus } from "@/types/refund-status";

export interface RefundRequestsForm {
  status: RefundStatus;
  reason?: string | null;
  remarks?: string | null;
}

const RefundRequestsPage: React.FC = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<RefundRequest[]>([]);

  const fetchRefundRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      console.log(`Token: ${token}`);
      console.log(`API URL: ${baseApiUrl}`);
      
      const response = await axios.get(`${baseApiUrl}/refund-request/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.data.success) {
        const requests = response.data.data;
        setRefundRequests(requests);
        setOriginalData(JSON.parse(JSON.stringify(requests))); // Deep copy for comparison
      } else {
        setRefundRequests([]);
        setOriginalData([]);
        setError("Failed to load refund requests: Invalid response format");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      let errorMessage = "Failed to load refund requests.";
      
      if (e.code === 'ERR_NETWORK') {
        errorMessage = `Cannot connect to server. Please make sure the backend is running on ${baseApiUrl}`;
      } else if (e.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (e.response?.status === 403) {
        errorMessage = "You don't have permission to access refund requests.";
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      console.error("Error fetching refund requests:", e);
      
      // Set empty arrays to prevent further errors
      setRefundRequests([]);
      setOriginalData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundRequests();
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

  const handleRefundRequestChange = (id: number, updatedData: Partial<RefundRequest>) => {
    setRefundRequests(prev => 
      prev.map(request => 
        request.id === id ? { ...request, ...updatedData } : request
      )
    );
    setHasChanges(true);
  }

  const handleUpdateRefundRequests = async () => {
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

      const updatePromises = refundRequests.map(async (request) => {
        const originalRequest = originalData.find(orig => orig.id === request.id);
        // Check if this request has changes
        if (originalRequest && (
          request.status !== originalRequest.status ||
          request.reason !== originalRequest.reason ||
          request.remarks !== originalRequest.remarks
        )) {
          return axios.put(`${baseApiUrl}/refund-request/${request.id}`, {
            status: request.status,
            reason: request.reason,
            remarks: request.remarks,
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            timeout: 10000,
          });
        }
        return Promise.resolve(null);
      });

      // Filter out null promises and wait for all updates to complete
      const validPromises = updatePromises.filter(promise => promise !== null);
      const results = await Promise.all(validPromises);
      
      // Check if any updates failed
      const failedUpdates = results.filter(result => result && result.status !== 200);
      
      if (failedUpdates.length === 0) {
        setSuccessMessage('All refund requests updated successfully!');
        setHasChanges(false);
        setIsEditing(false);
        // Refresh data to get the latest from server
        await fetchRefundRequests();
      } else {
        throw new Error(`${failedUpdates.length} updates failed`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update refund requests. Please try again.';
      setError(errorMessage);
      console.error('Error updating refund requests:', e);
    } finally {
      setSaving(false);
    }
  }

  const resetToOriginal = () => {
    setRefundRequests(JSON.parse(JSON.stringify(originalData)));
    setHasChanges(false);
  }

  const handleProcessRefunds = async () => {
    if (!window.confirm('Are you sure you want to process all pending refund requests? This will initiate refund transactions.')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${baseApiUrl}/refund-request/process-pending`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          timeout: 15000, // 15 second timeout for processing
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Pending refund requests processed successfully!');
        await fetchRefundRequests();
        setIsEditing(false);
        setHasChanges(false);
      } else {
        throw new Error(response.data.message || 'Failed to process refunds');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to process refund requests. Please try again.';
      setError(errorMessage);
      console.error('Error processing refunds:', e);
    } finally {
      setLoading(false);
    }
  }

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-slate-400 text-6xl mb-4">📄</div>
      <h3 className="text-lg font-medium text-slate-600 mb-2">
        No refund requests found
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        {error ? "There was an error loading refund requests." : "There are no refund requests to display."}
      </p>
      {error && (
        <button
          onClick={fetchRefundRequests}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
        >
          Try Again
        </button>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Refund Requests - Manong Admin</title>
        <meta name="description" content="Manage and view all refund requests." />
      </Helmet>

      <div className="flex flex-col items-center w-full justify-center gap-4 mt-4 px-5 sm:px-20 pb-10">
        {/* Action Buttons */}
        <div className="flex flex-row justify-between gap-2 mb-4 flex-wrap w-full max-w-6xl">
          <button 
            type="button" 
            className="btn btn-sm sm:btn-md" 
            onClick={handleProcessRefunds}
            disabled={loading || saving || refundRequests.length === 0}
          >
            {loading ? 'Processing...' : 'Process Pending Refunds'}
          </button>
          <div className="flex flex-row justify-end">
            <div className="flex flex-row gap-2">
              {hasChanges && (
                <>
                  <button 
                    type="button" 
                    className="btn btn-sm sm:btn-md bg-green-600 hover:bg-green-700 text-white" 
                    onClick={handleUpdateRefundRequests}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save All Changes'}
                  </button>
                </>
              )}
              <button 
                type="button" 
                className={clsx(
                  "btn btn-sm sm:btn-md",
                  isEditing && "bg-yellow-600! hover:bg-yellow-700!"
                )}
                onClick={handleEditingClick}
                disabled={saving || refundRequests.length === 0}
              >
                {isEditing ? 'Cancel Edit' : 'Manage Requests'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4 max-w-3xl">
          <h1 className="text-2xl font-semibold">
            Refund Requests
          </h1>
          <p className="mt-2 text-sm sm:text-base leading-relaxed">
            Monitor and manage all refund requests in the system. Each request
            represents a customer's request for reimbursement. Review the details
            and update the status accordingly.
          </p>
          
          {hasChanges && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                ⚠️ You have unsaved changes. Don't forget to save!
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading refund requests...</p>
          </div>
        ) : refundRequests.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 w-full max-w-6xl">
            {refundRequests.map((refundRequest) => (
              <RefundRequestCard
                key={refundRequest.id}
                refundRequest={refundRequest}
                onUpdate={handleRefundRequestChange}
                isEditing={isEditing}
              />
            ))}
          </div>
        )}
      </div>

      {successMessage && (
        <StatusAlertDialog
          isOpen={true}
          type="success"
          title="Update Successful"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

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

export default RefundRequestsPage;
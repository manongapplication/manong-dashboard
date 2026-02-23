import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Search } from "lucide-react";
import axios from "axios";
import type { ManongWalletTransaction } from "@/types/manong-wallet-transaction";
import type { WalletTransactionStatus } from "@/types/wallet-transaction-status";
import PayoutCard from '@/components/ui/payout-card';
import StatusAlertDialog from "@/components/ui/status-alert-dialog";
import clsx from "clsx";
import { useSearchParams } from "react-router-dom";

export interface PayoutForm {
  status: WalletTransactionStatus;
  description?: string | null;
  amount?: number;
}

const PayoutsPage: React.FC = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ManongWalletTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<ManongWalletTransaction[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<ManongWalletTransaction[]>([]);
  const [filterType, setFilterType] = useState<string>('payout');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchParams, setSearchParams] = useSearchParams();
  const [completingPayouts, setCompletingPayouts] = useState<Set<number>>(new Set());
  const [failingPayouts, setFailingPayouts] = useState<Set<number>>(new Set());

  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      const response = await axios.get(`${baseApiUrl}/manong-wallet-transaction/list/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 10000,
      });

      let data: ManongWalletTransaction[] = [];
      
      if (response.data.success && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      }

      setTransactions(data);
      setOriginalData(JSON.parse(JSON.stringify(data)));
      filterAndSortTransactions(data, filterType, searchQuery, sortOrder);
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      let errorMessage = "Failed to load wallet transactions.";
      
      if (e.code === 'ERR_NETWORK') {
        errorMessage = `Cannot connect to server. Please make sure the backend is running on ${baseApiUrl}`;
      } else if (e.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (e.response?.status === 403) {
        errorMessage = "You don't have permission to access transactions.";
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      console.error("Error fetching wallet transactions:", e);
      
      setTransactions([]);
      setFilteredTransactions([]);
      setOriginalData([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTransactions = (
    transactionsData: ManongWalletTransaction[], 
    currentFilter: string, 
    currentSearchQuery: string, 
    currentSortOrder: 'newest' | 'oldest'
  ) => {
    let filtered = [...transactionsData];

    // Apply type filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === currentFilter);
    }

    // Apply status filter
    if (currentFilter === 'pending') {
      filtered = filtered.filter(transaction => transaction.status === 'pending');
    } else if (currentFilter === 'completed') {
      filtered = filtered.filter(transaction => transaction.status === 'completed');
    } else if (currentFilter === 'failed') {
      filtered = filtered.filter(transaction => transaction.status === 'failed');
    }

    // Apply search filter
    if (currentSearchQuery.trim()) {
      filtered = filtered.filter(transaction => 
        transaction.id.toString().includes(currentSearchQuery) ||
        transaction.walletId.toString().includes(currentSearchQuery) ||
        transaction.description?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        transaction.metadata?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        transaction.currency?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        transaction.type?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        transaction.status?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        (transaction.wallet?.manong && 
          `${transaction.wallet.manong.firstName || ''} ${transaction.wallet.manong.lastName || ''}`
            .toLowerCase()
            .includes(currentSearchQuery.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return currentSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredTransactions(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchParams.set('search', query);
      setSearchParams(searchParams);
    } else {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
    filterAndSortTransactions(transactions, filterType, query, sortOrder);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterType(newFilter);
    filterAndSortTransactions(transactions, newFilter, searchQuery, sortOrder);
  };

  const handleSortChange = (newSortOrder: 'newest' | 'oldest') => {
    setSortOrder(newSortOrder);
    filterAndSortTransactions(transactions, filterType, searchQuery, newSortOrder);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      filterAndSortTransactions(transactions, filterType, searchQuery, sortOrder);
    }
  }, [searchQuery, filterType, sortOrder, transactions]);

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
  };

  const handleTransactionChange = (id: number, updatedData: Partial<ManongWalletTransaction>) => {
    const updatedTransactions = transactions.map(transaction => 
      transaction.id === id ? { ...transaction, ...updatedData } : transaction
    );
    setTransactions(updatedTransactions);
    filterAndSortTransactions(updatedTransactions, filterType, searchQuery, sortOrder);
    setHasChanges(true);
  };

  const handleUpdateTransaction = async (transaction: ManongWalletTransaction) => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No authentication token found. Please log in.");
        setSaving(false);
        return;
      }

      const response = await axios.put(
        `${baseApiUrl}/manong-wallet-transaction/${transaction.id}`,
        {
          status: transaction.status,
          description: transaction.description,
          amount: parseFloat(transaction.amount.toString()), // Ensure it's a number
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        setSuccessMessage('Transaction updated successfully!');
        setHasChanges(false);
        await fetchTransactions();
      } else {
        throw new Error(response.data.message || 'Failed to update transaction');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update transaction. Please try again.';
      setError(errorMessage);
      console.error('Error updating transaction:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAllTransactions = async () => {
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

      const changedTransactions = transactions.filter((transaction, index) => {
        const originalTransaction = originalData[index];
        return originalTransaction && (
          transaction.status !== originalTransaction.status ||
          transaction.description !== originalTransaction.description ||
          transaction.amount !== originalTransaction.amount
        );
      });

      const updatePromises = changedTransactions.map(async (transaction) => {
        return axios.put(`${baseApiUrl}/manong-wallet-transaction/${transaction.id}`, {
          status: transaction.status,
          description: transaction.description,
          amount: parseFloat(transaction.amount.toString()), // Ensure it's a number
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          timeout: 10000,
        });
      });

      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed === 0) {
        setSuccessMessage(`Successfully updated ${successful} transactions!`);
        setHasChanges(false);
        setIsEditing(false);
        await fetchTransactions();
      } else {
        throw new Error(`${failed} updates failed`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update transactions. Please try again.';
      setError(errorMessage);
      console.error('Error updating transactions:', e);
    } finally {
      setSaving(false);
    }
  };

  const resetToOriginal = () => {
    setTransactions(JSON.parse(JSON.stringify(originalData)));
    filterAndSortTransactions(JSON.parse(JSON.stringify(originalData)), filterType, searchQuery, sortOrder);
    setHasChanges(false);
  };

  const handleCompletePayout = async (transactionId: number) => {
    try {
      setCompletingPayouts(prev => new Set(prev).add(transactionId));
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        `${baseApiUrl}/manong-wallet-transaction/${transactionId}/complete-payout`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage('Payout completed successfully!');
        await fetchTransactions();
      } else {
        throw new Error(response.data.message || 'Failed to complete payout');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to complete payout';
      setError(errorMessage);
      console.error('Error completing payout:', e);
    } finally {
      setCompletingPayouts(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  const handleMarkPayoutAsFailed = async (transactionId: number) => {
    try {
      setFailingPayouts(prev => new Set(prev).add(transactionId));
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        `${baseApiUrl}/manong-wallet-transaction/${transactionId}/failed-payout`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage('Payout marked as failed successfully!');
        await fetchTransactions();
      } else {
        throw new Error(response.data.message || 'Failed to mark payout as failed');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to mark payout as failed';
      setError(errorMessage);
      console.error('Error marking payout as failed:', e);
    } finally {
      setFailingPayouts(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-slate-400 text-6xl mb-4">💰</div>
      <h3 className="text-lg font-medium text-slate-600 mb-2">
        {searchQuery.trim() ? "No transactions found matching your search" : "No transactions found"}
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        {error ? "There was an error loading transactions." : "There are no transactions to display."}
      </p>
      {error && (
        <button
          onClick={fetchTransactions}
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
        <title>Wallet Transactions - Manong Admin</title>
        <meta name="description" content="Manage and view all wallet transactions." />
      </Helmet>

      <div className="flex flex-col items-center w-full justify-center gap-4 mt-4 px-5 sm:px-20 pb-10">
        {/* Header */}
        <div className="text-center mt-4 max-w-3xl">
          <h1 className="text-2xl font-semibold">
            Wallet Transactions
          </h1>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-gray-600">
            Monitor and manage all wallet transactions in the system. Each transaction
            represents a financial activity in manong wallets. Review the details
            and update the status accordingly.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-6xl mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by ID, wallet, description, manong name, type, or status..."
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
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="select"
            >
              <option value="all">All Types</option>
              <option value="payout">Payouts</option>
              <option value="earning">Earnings</option>
              <option value="job_fee">Job Fees</option>
              <option value="topup">Top-ups</option>
              <option value="adjustment">Adjustments</option>
              <option value="refund">Refunds</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
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
                onClick={handleUpdateAllTransactions}
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
              disabled={saving || transactions.length === 0}
            >
              {isEditing ? 'Cancel Edit' : 'Manage Transactions'}
            </button>
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery.trim() && (
          <div className="w-full max-w-6xl">
            <p className="text-sm text-gray-600">
              Found {filteredTransactions.length} transaction(s) matching "{searchQuery}"
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

        {/* Transactions Summary */}
        {!loading && transactions.length > 0 && (
          <div className="w-full max-w-6xl p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Transactions Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
                <div className="text-gray-600">Total Transactions</div>
              </div>
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-green-600">
                  {transactions.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-gray-600">Completed</div>
              </div>
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-orange-600">
                  {transactions.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-gray-600">Pending</div>
              </div>
              <div className="text-center p-3 rounded border border-gray-600">
                <div className="text-2xl font-bold text-red-600">
                  {transactions.filter(t => t.status === 'failed').length}
                </div>
                <div className="text-gray-600">Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState />
        ) : (
          /* Transactions Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 w-full max-w-6xl">
            {filteredTransactions.map((transaction) => (
              <PayoutCard
                key={transaction.id}
                transaction={transaction}
                onUpdate={handleTransactionChange}
                onSave={handleUpdateTransaction}
                onCompletePayout={handleCompletePayout}
                onMarkAsFailed={handleMarkPayoutAsFailed}
                isEditing={isEditing}
                completingPayout={completingPayouts.has(transaction.id)}
                markingAsFailed={failingPayouts.has(transaction.id)}
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

export default PayoutsPage;
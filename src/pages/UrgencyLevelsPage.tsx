import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import axios from "axios";
import type { UrgencyLevel } from "@/types";
import UrgencyLevelCard from "@/components/ui/urgency-level-card";
import StatusAlertDialog from "@/components/ui/status-alert-dialog";
import clsx from "clsx";

export interface UrgencyLevelsForm {
  level: string;
  time?: string | null;
  price?: string | null;
}

const UrgencyLevelsPage: React.FC = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urgencyLevels, setUrgencyLevels] = useState<UrgencyLevel[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<UrgencyLevel[]>([]);

  const fetchUrgencyLevels = async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${baseApiUrl}/urgency-level`, {
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (response.data.success) {
        const levels = response.data.data;
        setUrgencyLevels(levels);
        setOriginalData(JSON.parse(JSON.stringify(levels))); // Deep copy for comparison
      } else {
        setUrgencyLevels([]);
        setOriginalData([]);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || "Failed to load urgency levels.");
      console.error(`Error fetching urgency levels:`, e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrgencyLevels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditingClick = () => {
    if (isEditing && hasChanges) {
      setIsEditing(false);
      resetToOriginal();
    } else {
      setIsEditing(prev => !prev);
    }
  }

  const handleUrgencyLevelChange = (id: number, updatedData: Partial<UrgencyLevel>) => {
    setUrgencyLevels(prev => 
      prev.map(level => 
        level.id === id ? { ...level, ...updatedData } : level
      )
    );
    setHasChanges(true);
  }

  const handleUpdateUrgencyLevels = async () => {
    if (!hasChanges) return;

    setSaving(true);
    setError(null);

    try {
      // Update all urgency levels that have changes
      const token = localStorage.getItem('token');
      const updatePromises = urgencyLevels.map(async (level) => {
        const originalLevel = originalData.find(orig => orig.id === level.id);
        // Check if this level has changes
        if (originalLevel && (
          level.level !== originalLevel.level ||
          level.time !== originalLevel.time ||
          level.price !== originalLevel.price
        )) {
          return axios.put(`${baseApiUrl}/urgency-level/${level.id}`, {
            level: level.level,
            time: level.time,
            price: level.price,
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          });
        }
        return Promise.resolve(null);
      });

      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const failedUpdates = results.filter(result => result && result.status !== 200);
      
      if (failedUpdates.length === 0) {
        setSuccessMessage('All urgency levels updated successfully!');
        setHasChanges(false);
        setIsEditing(false);
        // Refresh data to get the latest from server
        await fetchUrgencyLevels();
      } else {
        throw new Error('Some updates failed');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update urgency levels. Please try again.';
      setError(errorMessage);
      console.error('Error updating urgency levels:', e);
    } finally {
      setSaving(false);
    }
  }

  const resetToOriginal = () => {
    setUrgencyLevels(JSON.parse(JSON.stringify(originalData)));
    setHasChanges(false);
  }

  const handleResetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all urgency levels to default values? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${baseApiUrl}/urgency-level/reset-defaults`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Urgency levels reset to defaults successfully!');
        await fetchUrgencyLevels();
        setIsEditing(false);
        setHasChanges(false);
      } else {
        throw new Error('Failed to reset to defaults');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || 'Failed to reset urgency levels. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Urgency Levels - Manong Admin</title>
        <meta name="description" content="Manage and view all urgency levels." />
      </Helmet>

      <div className="flex flex-col items-center w-full justify-center gap-4 mt-4 px-5 sm:px-20 pb-10">
        {/* Action Buttons */}
        <div className="flex flex-row justify-between gap-2 mb-4 flex-wrap w-full max-w-6xl">
          <button 
            type="button" 
            className="btn btn-sm sm:btn-md" 
            onClick={handleResetToDefaults}
            disabled={loading || saving}
          >
            {loading ? 'Resetting...' : 'Reset to Defaults'}
          </button>
          <div className="flex flex-row justify-end">
            <div className="flex flex-row gap-2">
              {hasChanges && (
                <>
                  <button 
                    type="button" 
                    className="btn btn-sm sm:btn-md bg-green-600 hover:bg-green-700 text-white" 
                    onClick={handleUpdateUrgencyLevels}
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
                  isEditing && "bg-yellow-600 hover:bg-yellow-700 text-white"
                )}
                onClick={handleEditingClick}
                disabled={saving}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Levels'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4 max-w-3xl">
          <h1 className="text-2xl font-semibold">
            Urgency Levels
          </h1>
          <p className="mt-2 text-sm sm:text-base leading-relaxed">
            Monitor and manage all urgency levels in the system. Each level
            helps categorize the importance and response time required for
            different operations. Use these references to prioritize effectively.
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
            <p className="mt-4 text-slate-600">Loading urgency levels...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 w-full max-w-6xl">
            {urgencyLevels.map((urgencyLevel) => (
              <UrgencyLevelCard
                key={urgencyLevel.id}
                urgencyLevel={urgencyLevel}
                onUpdate={handleUrgencyLevelChange}
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

export default UrgencyLevelsPage;
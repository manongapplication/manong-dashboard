import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import axios from "axios";
import type { AppMaintenance } from "@/types/app-maintenance";
import AppMaintenanceCard from "@/components/ui/app-maintenance-card";
import StatusAlertDialog from "@/components/ui/status-alert-dialog";

export interface AppMaintenanceForm {
  isActive: boolean | string;
  startTime?: Date | null;
  endTime?: Date | null;
  message?: string | null;
}

const AppMaintenancePage: React.FC = () => {
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [oldAppMaintenance, setOldAppMaintenance] = useState<AppMaintenance | null>(null);
  const [appMaintenance, setAppMaintenance] = useState<AppMaintenance | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAppMaintenance = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${baseApiUrl}/app-maintenance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        setAppMaintenance(response.data.data);
        setOldAppMaintenance(response.data.data);
      } else {
        setAppMaintenance(null);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e);
      console.log(`Error to fetch app maintenance ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppMaintenance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateAppMaintenance = async (id: number, data: AppMaintenanceForm) => {
    setButtonLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(`${baseApiUrl}/app-maintenance/${id}`, data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage("App maintenance settings have been updated successfully!");
        fetchAppMaintenance();
      } else {
        console.log();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log(`Error saving app maintenance ${e}`);
    } finally {
      setButtonLoading(false);
    }
  }

  const handleOnCancelClick = () => {
    setAppMaintenance(oldAppMaintenance);
  }

  return (
    <>
      <Helmet>
        <title>App Maintenance - Manong Admin</title>
        <meta
          name="description"
          content="Manage the app maintenance mode in the Manong admin dashboard. Enable or disable maintenance, set start and end times, and display messages to users."
        />
      </Helmet>
      <div className="flex flex-col items-center justify-center gap-2 mt-4 px-5 sm:px-20">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading manongs...</p>
          </div>
        ) : (
          <AppMaintenanceCard 
            appMaintenance={appMaintenance}
            onCancel={handleOnCancelClick}
            onUpdate={handleUpdateAppMaintenance}
            isLoading={buttonLoading}
          />
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
    
  )
}

export default AppMaintenancePage;
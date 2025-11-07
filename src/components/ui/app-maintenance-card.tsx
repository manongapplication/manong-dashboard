import clsx from "clsx";
import { Wrench } from "lucide-react";
import { useState } from "react";
import Divider from "./divider";
import type { AppMaintenance } from "@/types/app-maintenance";
import { Controller, useForm } from "react-hook-form";
import type { AppMaintenanceForm } from "@/pages/AppMaintenancePage";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface AppMaintenanceCardProps {
  appMaintenance?: AppMaintenance | null;
  onCancel?: () => void;
  onUpdate: (id: number, data: AppMaintenanceForm) => Promise<void>;
  isLoading: boolean;
}

const AppMaintenanceCard = ({ appMaintenance, onCancel, onUpdate, isLoading } : AppMaintenanceCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppMaintenanceForm>();
  
  const handleEditClick = () => {
    setIsEditing(prev => !prev);
    reset({
      isActive: appMaintenance?.isActive ?? false,
      startTime: appMaintenance?.startTime ? new Date(appMaintenance.startTime) : null,
      endTime: appMaintenance?.endTime ? new Date(appMaintenance.endTime) : null,
      message: appMaintenance?.message ?? null,
    });
  }

  const onSubmit = (data: AppMaintenanceForm) => {
    if (appMaintenance?.id) {
       const formattedData = {
          ...data,
          isActive: data.isActive === true || data.isActive === "true",
          startTime: data.startTime ? new Date(data.startTime).toISOString() : null,
          endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
        };

        onUpdate(appMaintenance.id, formattedData as unknown as AppMaintenanceForm);
    }
    setIsEditing(false);
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card border flex flex-col gap-2 w-full">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-center gap-2">
          <Wrench className="w-4 h-4" />
          Settings
        </div>

        <button
          type="button"
          className={clsx("btn", isEditing && "bg-neutral")}
          onClick={handleEditClick}
        >
          Edit
        </button>
      </div>
      <Divider className="mb-2" />
      {isEditing ? (
        <div className="flex flex-row justify-between">
          <p>App Maintenance Active: </p>
          <select
            {...register('isActive')}
            className="select w-24"
            disabled={isLoading}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>

          {errors.isActive && (
            <p className="text-xs text-red-600 mt-1">{errors.isActive.message}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-row justify-between">
          <p>App Maintenance Active</p>
          <p>{appMaintenance?.isActive ? "True" : "False"}</p>
        </div>
      )}
      
      <Divider />

      {isEditing ? (
        <div className="flex flex-row justify-between">
          <p>Start Time</p>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}
                showTimeSelect
                disabled={isLoading}
                dateFormat="yyyy-MM-dd HH:mm"
                className="input input-sm"
                placeholderText="Select start time"
              />
            )}
          />

          {errors.startTime && (
            <p className="text-xs text-red-600 mt-1">{errors.startTime.message}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-row justify-between">
          <p>Start Time</p>
           {appMaintenance?.startTime
            ? new Date(appMaintenance.startTime).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : 'Not set'}
        </div>
      )}
      
      <Divider />

      {isEditing ? (
        <div className="flex flex-row justify-between">
          <p>End Time</p>
          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date) => field.onChange(date)}
                showTimeSelect
                disabled={isLoading}
                dateFormat="yyyy-MM-dd HH:mm"
                className="input input-sm"
                placeholderText="Select end time"
              />
            )}
          />

          {errors.endTime && (
            <p className="text-xs text-red-600 mt-1">{errors.endTime.message}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-row justify-between">
          <p>End Time:</p>
          {appMaintenance?.endTime
            ? new Date(appMaintenance.endTime).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : 'Not set'}
        </div>
      )}
      
      <Divider />

      {isEditing ? (
        <div className="flex flex-row justify-between">
          <p>Message:</p>
          <textarea
            {...register('message')}
            className="textarea" 
            disabled={isLoading}
            placeholder="Type the message...">
          </textarea>

          {errors.message && (
            <p className="text-xs text-red-600 mt-1 text-wrap">{errors.message.message}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-row justify-between">
          <p>Message:</p>
          <p className="max-w-sm whitespace-pre-wrap wrap-break-word text-left">
            {appMaintenance?.message != null ? appMaintenance.message.toString() : 'Not set'}
          </p>
        </div>
      )}

      <div className="mt-2 flex flex-row justify-end gap-2">
        <button
          type="submit"
          className="btn"
        >
          Save
        </button>

        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            onCancel?.();
          }}
          className="btn btn-gray-500!"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default AppMaintenanceCard;
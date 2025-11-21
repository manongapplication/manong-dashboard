import { useState, useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { ManongReport, UpdateManongReportData } from "@/types/manong-report";
import Modal from "@/components/ui/modal";

interface ManongReportCardProps {
  report: ManongReport;
  isEditing?: boolean;
  onUpdate: (id: number, data: Partial<ManongReport>) => void;
  onSave?: (report: ManongReport) => void;
}

const ManongReportCard: React.FC<ManongReportCardProps> = ({ 
  report, 
  isEditing, 
  onUpdate,
  onSave 
}) => {
  const [localData, setLocalData] = useState<Partial<ManongReport>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string>('Image Preview');
  const [modalContent, setModalContent] = useState<ReactNode>(<></>);

  const baseApiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue
  } = useForm<UpdateManongReportData>();

  // Summary categories from Flutter implementation
  const summaryCategories = [
    {
      title: '✅ Fully Completed',
      summaries: [
        'Successfully completed all service work',
        'Finished repairs as requested',
        'Completed installation successfully',
        'Performed maintenance and cleaning',
        'Fixed the issue and tested working',
      ],
    },
    {
      title: '⚠️ Completed but Needs Follow-up',
      summaries: [
        'Completed service with follow-up recommended',
        'Finished work but needs parts replacement',
        'Emergency repair completed, full service needed later',
      ],
    },
  ];

  // Parse imagesPath to get existing image URLs
  const getExistingImages = (): string[] => {
    if (!report.imagesPath) return [];
    try {
      // imagesPath is stored as JSON string array
      const parsed = JSON.parse(report.imagesPath);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // If parsing fails, return as single item array
      return [report.imagesPath];
    }
  };

  const existingImages = getExistingImages();

  // Check if we have additional details to show
  const hasAdditionalDetails = 
    (report.details && report.details.length > 0) ||
    (report.materialsUsed && report.materialsUsed.length > 0) ||
    (report.issuesFound && report.issuesFound.length > 0) ||
    (report.recommendations && report.recommendations.length > 0) ||
    (report.warrantyInfo && report.warrantyInfo.length > 0);

  // Initialize form
  useEffect(() => {
    if (!isInitialized) {
      reset({
        summary: report.summary,
        details: report.details || '',
        materialsUsed: report.materialsUsed || '',
        laborDuration: report.laborDuration || undefined,
        issuesFound: report.issuesFound || '',
        customerPresent: report.customerPresent || undefined,
        totalCost: report.totalCost || undefined,
        warrantyInfo: report.warrantyInfo || '',
        recommendations: report.recommendations || '',
      });
      setIsInitialized(true);
    }
  }, [report, reset, isInitialized]);

  // Reset form when exiting edit mode
  useEffect(() => {
    if (!isEditing) {
      reset({
        summary: report.summary,
        details: report.details || '',
        materialsUsed: report.materialsUsed || '',
        laborDuration: report.laborDuration || undefined,
        issuesFound: report.issuesFound || '',
        customerPresent: report.customerPresent || undefined,
        totalCost: report.totalCost || undefined,
        warrantyInfo: report.warrantyInfo || '',
        recommendations: report.recommendations || '',
      });
      setLocalData({});
      setNewImages([]);
      setImagePreviews([]);
      setShowFullDetails(false);
    }
  }, [isEditing, report, reset]);

  // Watch for form changes
  useEffect(() => {
    if (isEditing && isInitialized) {
      const subscription = watch((formData) => {
        const updatedData: Partial<ManongReport> = {};
        let hasChanges = false;

        Object.keys(formData).forEach(key => {
          if (formData[key as keyof UpdateManongReportData] !== 
              (report[key as keyof ManongReport] || '')) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updatedData[key as keyof ManongReport] = formData[key as keyof UpdateManongReportData] as any;
            hasChanges = true;
          }
        });

        if (hasChanges || newImages.length > 0) {
          setLocalData(updatedData);
          onUpdate(report.id, { ...updatedData });
        } else {
          setLocalData({});
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [watch, isEditing, report, onUpdate, isInitialized, newImages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 3) {
      alert('You can only upload up to 3 images');
      return;
    }

    setNewImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleViewImage = (imagePath: string, imageName: string = 'Service Image') => {
    setIsModalOpen(true);
    setModalTitle(imageName);
    setModalContent(
      <div className="flex items-center justify-center max-h-[80vh]">
        <img 
          src={buildImageUrl(imagePath)} 
          alt={imageName}
          className="max-w-full max-h-full object-contain rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
          }}
        />
      </div>
    );
  };

  const onSubmit = (data: UpdateManongReportData) => {
    const formattedData: Partial<ManongReport> = {
      ...data,
    };
    
    onUpdate(report.id, formattedData);
    onSave?.({
      ...report,
      ...formattedData
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'inprogress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'unpaid': return 'bg-red-100 text-red-600 border-red-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper to get service request number
  const getRequestNumber = () => {
    return report.serviceRequest?.requestNumber || `#${report.serviceRequestId}`;
  };

  // Helper to get manong name
  const getManongName = () => {
    if (report.manong) {
      return `${report.manong.firstName} ${report.manong.lastName}`;
    }
    if (report.serviceRequest?.manong) {
      return `${report.serviceRequest.manong.firstName} ${report.serviceRequest.manong.lastName}`;
    }
    return 'Unknown Manong';
  };

  // Helper to get customer name
  const getCustomerName = () => {
    return report.serviceRequest?.user ? 
      `${report.serviceRequest.user.firstName} ${report.serviceRequest.user.lastName}` : 
      'Unknown Customer';
  };

  // Build image URL for display - fix path separators
  const buildImageUrl = (imagePath: string) => {
    // Normalize path separators
    const normalizedPath = imagePath.replace(/\\/g, '/');
    
    if (normalizedPath.startsWith('http')) return normalizedPath;
    
    // Use baseUrl if available, otherwise baseApiUrl
    const base = baseUrl || baseApiUrl || '';
    return `${base}/${normalizedPath.replace(/^\/+/, '')}`;
  };

  // Render additional details conditionally based on showFullDetails state
  const renderAdditionalDetails = () => {
    const detailsToShow = [];

    if (report.details) {
      detailsToShow.push(
        <div key="details">
          <h4 className="font-medium mb-1">Details</h4>
          <p className="text-sm">{report.details}</p>
        </div>
      );
    }

    if (report.materialsUsed) {
      detailsToShow.push(
        <div key="materials">
          <h4 className="font-medium mb-1">Materials Used</h4>
          <p className="text-sm">{report.materialsUsed}</p>
        </div>
      );
    }

    if (report.issuesFound) {
      detailsToShow.push(
        <div key="issues">
          <h4 className="font-medium mb-1">Issues Found</h4>
          <p className="text-sm">{report.issuesFound}</p>
        </div>
      );
    }

    if (report.recommendations) {
      detailsToShow.push(
        <div key="recommendations">
          <h4 className="font-medium mb-1">Recommendations</h4>
          <p className="text-sm">{report.recommendations}</p>
        </div>
      );
    }

    if (report.warrantyInfo) {
      detailsToShow.push(
        <div key="warranty">
          <h4 className="font-medium mb-1">Warranty Information</h4>
          <p className="text-sm">{report.warrantyInfo}</p>
        </div>
      );
    }

    // If showFullDetails is true, show all details
    if (showFullDetails) {
      return detailsToShow;
    }

    // Otherwise, show only the first 2 details
    return detailsToShow.slice(0, 2);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg shadow-sm p-6 border border-gray-600 hover:shadow-md transition-shadow w-full">
        {isEditing ? (
          <>
            {/* Editable Form - Horizontal Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column - Summary and Images */}
              <div className="flex-1 space-y-4">
                {/* Summary Options */}
                <div>
                  <label className="block text-sm font-medium mb-2">Summary *</label>
                  <div className="space-y-3">
                    {summaryCategories.map((category, categoryIndex) => (
                      <div key={categoryIndex}>
                        <p className="text-sm font-medium mb-2">{category.title}</p>
                        <div className="flex flex-wrap gap-2">
                          {category.summaries.map((summary, summaryIndex) => (
                            <button
                              key={summaryIndex}
                              type="button"
                              onClick={() => setValue('summary', summary)}
                              className={`cursor-pointer px-3 py-1 rounded-full text-xs border transition-colors ${
                                watch('summary') === summary
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-600'
                              }`}
                            >
                              {summary}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <textarea
                    {...register('summary', { required: 'Summary is required' })}
                    className="w-full mt-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
                    placeholder="Or write your own summary..."
                  />
                  {errors.summary && (
                    <p className="text-red-500 text-xs mt-1">{errors.summary.message}</p>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Photos ({newImages.length}/3)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    New photos replace existing • Upload proof of completed work
                  </p>
                  
                  {/* Image Previews */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {/* New Image Previews */}
                    {imagePreviews.map((preview, index) => (
                      <img
                        key={`new-${index}`}
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border cursor-pointer"
                        onClick={() => handleViewImage(preview, `Preview ${index + 1}`)}
                      />
                    ))}
                    
                    {/* Existing Images */}
                    {existingImages.map((imagePath, index) => {
                      const imageName = imagePath.split(/[\\/]/).pop() || `Image ${index + 1}`;
                      return (
                        <img
                          key={`existing-${index}`}
                          src={buildImageUrl(imagePath)}
                          alt={`Existing ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleViewImage(imagePath, imageName)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column - Form Fields */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Details</label>
                    <textarea
                      {...register('details')}
                      className="textarea"
                      rows={3}
                      placeholder="Enter service details..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Materials Used</label>
                    <textarea
                      {...register('materialsUsed')}
                      className="textarea"
                      rows={3}
                      placeholder="List materials used..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Labor Duration (hours)</label>
                    <input
                      type="number"
                      {...register('laborDuration', { valueAsNumber: true })}
                      className="input"
                      placeholder="Enter hours worked..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Total Cost (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('totalCost', { valueAsNumber: true })}
                      className="input"
                      placeholder="Enter total cost..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Customer Present</label>
                    <select
                      {...register('customerPresent', { valueAsNumber: false })}
                      className="input"
                    >
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Issues Found</label>
                  <textarea
                    {...register('issuesFound')}
                    className="textarea"
                    rows={2}
                    placeholder="Describe any issues found..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Recommendations</label>
                  <textarea
                    {...register('recommendations')}
                    className="textarea"
                    rows={2}
                    placeholder="Provide recommendations..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Warranty Information</label>
                  <textarea
                    {...register('warrantyInfo')}
                    className="textarea"
                    rows={2}
                    placeholder="Enter warranty details..."
                  />
                </div>

                {/* Unsaved Changes Indicator */}
                {(Object.keys(localData).length > 0 || newImages.length > 0) && (
                  <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ You have unsaved changes
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Display Mode - Horizontal Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column - Header, Summary, and Basic Info */}
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium">Service Report</h2>
                    <h1 className="text-xl font-bold text-blue-600">
                      #{report.id}
                    </h1>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatDate(report.createdAt)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Summary</h3>
                  <p className="leading-relaxed">{report.summary}</p>
                </div>

                {/* Service Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Service Request:</span>
                    <p>{getRequestNumber()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Manong:</span>
                    <p>{getManongName()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Customer:</span>
                    <p>{getCustomerName()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Report ID:</span>
                    <p>#{report.id}</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {report.serviceRequest?.status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.serviceRequest.status)}`}>
                      {report.serviceRequest.status.toUpperCase()}
                    </span>
                  )}
                  {report.serviceRequest?.paymentStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(report.serviceRequest.paymentStatus)}`}>
                      PAYMENT: {report.serviceRequest.paymentStatus.toUpperCase()}
                    </span>
                  )}
                  {report.customerPresent !== null && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      report.customerPresent 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      CUSTOMER: {report.customerPresent ? 'PRESENT' : 'NOT PRESENT'}
                    </span>
                  )}
                  {report.verifiedByUser && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                      VERIFIED BY CUSTOMER
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column - Images and Additional Details */}
              <div className="flex-1 space-y-4">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Service Images</h4>
                    <div className="flex gap-2 overflow-x-auto">
                      {existingImages.map((imagePath, index) => {
                        const imageName = imagePath.split(/[\\/]/).pop() || `Service Image ${index + 1}`;
                        return (
                          <img
                            key={index}
                            src={buildImageUrl(imagePath)}
                            alt={`Service image ${index + 1}`}
                            className="w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleViewImage(imagePath, imageName)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="space-y-3">
                  {report.laborDuration && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Labor Duration:</span>
                      <span>{report.laborDuration} hours</span>
                    </div>
                  )}

                  {report.totalCost && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Total Cost:</span>
                      <span className="text-green-600 font-semibold">₱{report.totalCost}</span>
                    </div>
                  )}

                  {/* Conditionally rendered additional details */}
                  {renderAdditionalDetails()}
                </div>

                {/* Show More/Less Toggle */}
                {hasAdditionalDetails && renderAdditionalDetails().length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDetails(!showFullDetails)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {showFullDetails ? 'Show less' : 'Show more details'}
                  </button>
                )}

                {/* Last Updated */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Last updated: {formatDate(report.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </form>

      {/* Image Preview Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
      >
        {modalContent}
      </Modal>
    </>
  );
};

export default ManongReportCard;
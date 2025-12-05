import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import Modal from "@/components/ui/modal";

interface SubServiceItem {
  id: number;
  title: string;
  serviceItem: {
    id: number;
    title: string;
  };
}

interface SpecialitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpecialities: number[];
  availableItems: SubServiceItem[];
  onSave: (selectedIds: number[]) => Promise<void>;
  title?: string;
}

const SpecialitiesModal = ({
  isOpen,
  onClose,
  currentSpecialities,
  availableItems,
  onSave,
  title = "Edit Specialities"
}: SpecialitiesModalProps) => {
  const [selectedIds, setSelectedIds] = useState<number[]>(currentSpecialities);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSelectedIds(currentSpecialities);
  }, [currentSpecialities, isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(selectedIds);
      onClose();
    } catch (error) {
      console.error('Failed to save specialities:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const toggleAllInCategory = (categoryItems: SubServiceItem[]) => {
    const categoryIds = categoryItems.map(item => item.id);
    const allSelected = categoryIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      // Remove all from this category
      setSelectedIds(prev => prev.filter(id => !categoryIds.includes(id)));
    } else {
      // Add all from this category
      const newIds = [...selectedIds];
      categoryIds.forEach(id => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
      setSelectedIds(newIds);
    }
  };

  // Group by service item
  const groupedItems = availableItems.reduce((acc, item) => {
    const category = item.serviceItem.title;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, SubServiceItem[]>);

  // Filter items based on search
  const filteredGroups = Object.entries(groupedItems).reduce((acc, [category, items]) => {
    const filteredItems = items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredItems.length > 0) {
      acc[category] = filteredItems;
    }
    
    return acc;
  }, {} as Record<string, SubServiceItem[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search specialities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Selected count */}
        <div className="text-sm text-gray-600">
          {selectedIds.length} specialities selected
        </div>

        {/* Categories and items */}
        <div className="max-h-96 overflow-y-auto space-y-4">
          {Object.entries(filteredGroups).map(([category, items]) => (
            <div key={category} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 flex justify-between items-center">
                <h3 className="font-medium text-gray-900">{category}</h3>
                <button
                  onClick={() => toggleAllInCategory(items)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {items.every(item => selectedIds.includes(item.id)) 
                    ? "Deselect all" 
                    : "Select all"}
                </button>
              </div>
              <div className="p-3 space-y-2">
                {items.map(item => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="flex-1">{item.title}</span>
                    {selectedIds.includes(item.id) && (
                      <Check size={16} className="text-green-600" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SpecialitiesModal;
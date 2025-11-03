import { colorOptions } from "@/utils/color-utils";
import CreatableSelect from "react-select/creatable";
import type { ServiceItem } from "@/types";

type ColorOption = { value: string; label: string };

export default function ColorInput({
  selectedColorInput,
  setSelectedColorInput,
  currentValue,
  setServicesItem,
  selectedId,
  className,
}: {
  selectedColorInput: string;
  setSelectedColorInput: (val: string) => void;
  currentValue: string;
  setServicesItem: React.Dispatch<React.SetStateAction<ServiceItem[] | undefined>>;
  selectedId: number;
  className?: string;
}) {
  return (
    <CreatableSelect<ColorOption, false>
      options={colorOptions}
      value={currentValue ? { value: currentValue, label: currentValue } : null}
      onChange={(opt) => {
        if (!opt) return;
        const val = opt.value;

        setServicesItem(prev =>
          prev
            ? prev.map(item =>
                item.id === selectedId
                  ? { ...item, [selectedColorInput]: val }
                  : item
              )
            : []
        );
      }}
      isClearable
      isSearchable
      onFocus={() => setSelectedColorInput(selectedColorInput)}
      onMenuOpen={() => setSelectedColorInput(selectedColorInput)}
      placeholder="Enter hex or select..."
      formatCreateLabel={(inputValue) => `Use "${inputValue}"`}
      filterOption={() => true}
      styles={{
        menu: (provided) => ({ ...provided, zIndex: 9999 }),
      }}
      className={className}
    />
  );
}

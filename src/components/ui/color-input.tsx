import type { ServicePageForm } from "@/pages/ServicesPage";
import { colorOptions } from "@/utils/color-utils";
import CreatableSelect from "react-select/creatable";
import { useForm } from "react-hook-form";
import type { ServiceItem } from "@/types";

type ColorOption = { value: string; label: string };

export default function ColorInput({
  selectedColorInput,
  setSelectedColorInput,
  currentValue,
  form,
  setServicesItem,
  selectedId,
  className,
}: {
  selectedColorInput: string;
  setSelectedColorInput: (val: string) => void;
  currentValue: string;
  form: ReturnType<typeof useForm<ServicePageForm>>;
  setServicesItem: React.Dispatch<React.SetStateAction<ServiceItem[] | undefined>>;
  selectedId: number;
  className?: string;
}) {
  const { setValue, } = form;

  return (
    <CreatableSelect<ColorOption, false>
      options={colorOptions}
      value={currentValue ? { value: currentValue, label: currentValue } : null}
      onChange={(opt) => {
        if (!opt) return;
        const val = opt.value;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(`services.${selectedId}.${selectedColorInput}` as any, val);
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

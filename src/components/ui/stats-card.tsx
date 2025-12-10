import clsx from "clsx";
import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

type IconType = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

interface StatsCardProps {
  title: string;
  value: number | string;
  Icon: IconType;
  color?: string;
  bgColor?: string;
  isDecimal?: boolean;
  showStar?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title,
  value,
  Icon,
  color,
  bgColor,
  isDecimal = false,
  showStar = false,
  isClickable = false,
  onClick
}) => {
  // Format the value
  const formattedValue = typeof value === 'number' 
    ? (isDecimal ? value.toFixed(1) : value.toLocaleString())
    : value;
  
  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };
  
  return (
    <div 
      onClick={handleClick}
      className={clsx(
        localStorage.getItem("theme") == 'dark' 
          ? "border-slate-700 bg-slate-800" 
          : "bg-white border-slate-200", 
        "rounded-xl shadow-sm border p-6 flex items-center gap-4 hover:shadow-md transition-shadow",
        isClickable && "cursor-pointer hover:border-blue-300 active:scale-[0.98] transition-transform"
      )}
    >
      <div className={`${bgColor} ${color} p-3 rounded-lg`}>
        <Icon size={24} />
      </div>
      <div>
        <p className={clsx(
          "text-sm font-medium",
          localStorage.getItem("theme") == 'dark' 
            ? "text-slate-300" 
            : "text-slate-600"
        )}>
          {title}
        </p>
        <p className={clsx(
          "text-2xl font-bold flex items-center gap-1",
          localStorage.getItem("theme") == 'dark' 
            ? "text-white" 
            : "text-slate-800"
        )}>
          {formattedValue}
          {showStar && " ★"}
        </p>
        {isClickable && (
          <p className={clsx(
            "text-xs mt-1",
            localStorage.getItem("theme") == 'dark' 
              ? "text-blue-400" 
              : "text-blue-600"
          )}>
            Click to view
          </p>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
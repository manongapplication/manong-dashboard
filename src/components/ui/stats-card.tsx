import clsx from "clsx";
import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

type IconType = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

interface StatsCard {
  title: string;
  value: number;
  Icon: IconType;
  color?: string;
  bgColor?: string;
  isDecimal?: boolean; // Add this
  showStar?: boolean; // Add this for rating stars
}

const StatsCard: React.FC<StatsCard> = ({ 
  title,
  value,
  Icon,
  color,
  bgColor,
  isDecimal = false,
  showStar = false
}) => {
  // Format the value
  const formattedValue = isDecimal ? value.toFixed(1) : value.toLocaleString();
  
  return (
    <div className={clsx(
      localStorage.getItem("theme") == 'dark' 
        ? "border-slate-700 bg-slate-800" 
        : "bg-white border-slate-200", 
      "rounded-xl shadow-sm border p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
    )}>
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
      </div>
    </div>
  );
}

export default StatsCard;
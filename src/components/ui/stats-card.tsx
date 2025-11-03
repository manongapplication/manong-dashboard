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
}

const StatsCard: React.FC<StatsCard> = ({ 
  title,
  value,
  Icon,
  color,
  bgColor
}) => {
  return (
    <div className={clsx(localStorage.getItem("theme") == 'dark' ? "border-slate-700" : "bg-white border-slate-200", "rounded-xl shadow-sm border p-6 flex items-center gap-4 hover:shadow-md transition-shadow")}>
      <div className={`${bgColor} ${color} p-3 rounded-lg`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-600 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default StatsCard;
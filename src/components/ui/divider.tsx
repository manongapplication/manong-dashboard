import clsx from "clsx";

interface DividerProps {
  className?: string;
}

const Divider = ({ className }: DividerProps) => {
  const isDark = localStorage.getItem("theme") == 'dark';
  return (
    <div
      className={clsx(
        isDark ? "border-b border-slate-600" : "border-b border-slate-100",
        className, 
      )}
    />
  );
}

export default Divider;
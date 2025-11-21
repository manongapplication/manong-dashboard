import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, Users, Settings, LogOut, Moon, Sun, WrenchIcon, ToolCase, Clock, NotebookPen, Notebook } from "lucide-react";

const Layout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/users", label: "Users", icon: Users },
    { to: "/services", label: "Services", icon: ToolCase },
    { to: "/app-maintenance", label: "App Maintenance", icon: WrenchIcon },
    { to: "/urgency-levels", label: "Urgency Levels", icon: Clock },
    { to: "/refund-requests", label: "Refund Requests", icon: NotebookPen },
    { to: "/manong-reports", label: "Manong Reports", icon: Notebook },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  // 🔹 Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

    const theme = localStorage.getItem("theme");
  
    useEffect(() => {
      document.querySelector("html")?.setAttribute("data-theme", theme ?? 'light');
      setDarkMode(theme == 'dark' ? true : false);
    }, [theme]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setDropdownOpen(false);
    navigate("/login");
  };

  const location = useLocation();

  const pageTitle = navItems.find(item => item.to === location.pathname)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-base-100 text-base-content transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-base-200 border-r border-base-300 transform transition-transform duration-300 ease-in-out
        ${menuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-xl font-bold text-primary">Manong</h1>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="md:hidden text-base-content/70 hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-content shadow-md"
                    : "text-base-content/70 hover:bg-base-300"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay (for mobile only) */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main Section */}
      <div className="flex flex-col flex-1 w-full md:w-[calc(100%-16rem)]">
        {/* Top Bar */}
        <header className="flex items-center justify-between bg-base-200/80 backdrop-blur-md border-b border-base-300 px-6 py-4 sticky top-0 z-20">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-base-content/70 hover:text-primary transition-colors md:hidden"
          >
            <Menu size={24} />
          </button>

          <h2 className="text-lg font-semibold">{pageTitle}</h2>

          <div className="flex items-center gap-4" ref={dropdownRef}>
            {/* 🌙 Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="btn btn-ghost btn-sm flex items-center gap-2"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span className="hidden md:inline text-sm">{darkMode ? "Light" : "Dark"}</span>
            </button>

            {/* 👤 User Dropdown */}
            <div className="hidden md:flex items-center gap-3 relative">
              <div className="text-right">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs opacity-70">Super Admin</p>
              </div>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-primary w-10 h-10 rounded-full flex items-center justify-center hover:shadow-md transition-all"
              >
                <span className="text-primary-content font-semibold text-sm">A</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-base-200 rounded-lg shadow-lg border border-base-300 py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-300 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-base-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

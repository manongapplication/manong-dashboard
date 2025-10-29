import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, Users, Settings, LogOut, Wrench } from "lucide-react";

const Layout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/users", label: "Users", icon: Users },
    { to: "/services", label: "Services", icon: Wrench },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Close dropdown
    setDropdownOpen(false);
    
    // Redirect to login page (adjust path as needed)
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${menuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-light-cyan rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-light-cyan bg-clip-text text-transparent">
              Manong
            </h1>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="md:hidden text-slate-600 hover:text-blue-600 transition-colors"
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
                    ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? "text-white" : "text-slate-500"} />
                  {label}
                </>
              )}
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
        <header className="flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-slate-700 hover:text-blue-600 transition-colors md:hidden"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">Dashboard</h2>
          <div className="w-6 md:hidden" />
          
          {/* User Avatar with Dropdown - Desktop Only */}
          <div className="hidden md:flex items-center gap-3 relative" ref={dropdownRef}>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">Admin</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-gradient-primary w-10 h-10 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-teal-500/30 transition-all"
            >
              <span className="text-white font-semibold text-sm">A</span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LogOut size={16} className="text-slate-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
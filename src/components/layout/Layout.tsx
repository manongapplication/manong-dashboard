import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Menu, X, LayoutDashboard, Users, Settings } from "lucide-react";

const Layout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/users", label: "Users", icon: Users },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${menuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
                    ? "bg-primary text-white shadow-lg shadow-teal-500/30"
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
          
          {/* User Avatar - Desktop Only */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">Admin</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
            <div
              className="bg-gradient-primary w-10 h-10 rounded-full flex items-center justify-center"
            >
              <span className="text-white font-semibold text-sm">A</span>
            </div>

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
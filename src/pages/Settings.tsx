import React, { useEffect, useState } from "react";

const Settings: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Apply theme on load
  useEffect(() => {
    document.querySelector("html")?.setAttribute("data-theme", theme);
  }, [theme]);

  // Toggle dark/light theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.querySelector("html")?.setAttribute("data-theme", newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login"; // adjust to your route
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="flex items-center justify-between mb-4">
        <span className="font-medium">Dark Mode</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={theme === "dark"}
          onChange={toggleTheme}
        />
      </div>

      <div className="divider"></div>

      <button
        onClick={handleLogout}
        className="btn btn-error w-full mt-4 text-white"
      >
        Logout
      </button>
    </div>
  );
};

export default Settings;

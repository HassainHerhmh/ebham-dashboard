import React, { useState } from "react";
import { Menu, Bell, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    navigate("/login", { replace: true });
  };

  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null;

  return (
    <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between relative">
      <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100">
        <Menu size={24} className="text-gray-600" />
      </button>
      <div className="flex items-center gap-4">
        <Bell size={20} className="text-gray-600" />
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || "مستخدم"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === "admin" ? "مدير النظام" : "موظف"}
              </p>
            </div>
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </div>
          {menuOpen && (
            <div className="absolute left-0 mt-3 w-40 bg-white border rounded-lg shadow-lg z-50 text-right">
              <button
                onClick={handleLogout}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <span>تسجيل خروج</span>
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  Settings,
  Store,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { hasPermission } from "../utils/permissions";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuItem = {
  key: string;
  label: string;
  path: string;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null;

  const isAdmin = user?.role?.toLowerCase() === "admin";

  // حالات طي القوائم
  const [areasOpen, setAreasOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* =========================
     القوائم
  ========================= */

  const areasGroup: MenuItem[] = [
    { key: "cities", label: "مدن التوصيل", path: "/cities" },
    { key: "neighborhoods", label: "الأحياء", path: "/neighborhoods" },
  ];

  const deliveryGroup: MenuItem[] = [
    { key: "restaurants", label: "المطاعم", path: "/restaurants" },
    { key: "products", label: "المنتجات", path: "/products" },
    { key: "categories", label: "الفئات", path: "/categories" },
    { key: "units", label: "الوحدات", path: "/units" },
    { key: "types", label: "الأنواع", path: "/types" },
  ];

  const agentsGroup: MenuItem[] = [
    { key: "agents", label: "الوكلاء", path: "/agents" },
    { key: "agent_info", label: "معلومات الوكلاء", path: "/agents/info" },
    { key: "agent_groups", label: "مجموعة الوكلاء", path: "/agents/groups" },
  ];

  const settingsGroup: MenuItem[] = [
    { key: "stores", label: "المتاجر", path: "/settings/stores" },
    { key: "payment", label: "الدفع", path: "/settings/payment" },
    { key: "currency", label: "العملات", path: "/settings/currency" },
    { key: "branches", label: "الفروع", path: "/settings/branches" },
  ];

  /* =========================
     Helpers
  ========================= */

  const canShow = (key: string) =>
    isAdmin || hasPermission(user, key, "view");

  const isPathActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path ||
        location.pathname.startsWith(path + "/");

  const linkBase =
    "block rounded px-4 py-2 text-gray-700 hover:bg-blue-100 transition-colors";
  const active = "bg-blue-100 font-semibold";

  /* =========================
     Render
  ========================= */

  return (
    <aside
      className={`fixed inset-y-0 right-0 transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } md:translate-x-0 md:static md:w-64 bg-white shadow-xl z-50 transition-transform duration-300`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">لوحة الإدارة</h2>
          <button className="md:hidden" onClick={onClose}>✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">

          {/* لوحة التحكم */}
          {canShow("dashboard") && (
            <Link to="/" onClick={onClose}
              className={`${linkBase} ${isPathActive("/") ? active : ""}`}>
              لوحة التحكم
            </Link>
          )}

          {/* المستخدمين */}
          {canShow("users") && (
            <Link to="/users" onClick={onClose}
              className={`${linkBase} ${isPathActive("/users") ? active : ""}`}>
              المستخدمين
            </Link>
          )}

          {/* العملاء */}
          {canShow("customers") && (
            <Link to="/customers" onClick={onClose}
              className={`${linkBase} ${isPathActive("/customers") ? active : ""}`}>
              العملاء
            </Link>
          )}

          {/* الكباتن */}
          {canShow("captains") && (
            <Link to="/captains" onClick={onClose}
              className={`${linkBase} ${isPathActive("/captains") ? active : ""}`}>
              الكباتن
            </Link>
          )}

          {/* الطلبات */}
          {canShow("orders") && (
            <Link to="/orders" onClick={onClose}
              className={`${linkBase} ${isPathActive("/orders") ? active : ""}`}>
              الطلبات
            </Link>
          )}

          
          {/* التسويق */}
          {canShow("marketing") && (
            <Link to="/marketing" onClick={onClose}
              className={`${linkBase} ${isPathActive("/marketing") ? active : ""}`}>
              التسويق
            </Link>
          )}

          {/* التقارير */}
          {canShow("reports") && (
            <Link to="/reports" onClick={onClose}
              className={`${linkBase} ${isPathActive("/reports") ? active : ""}`}>
              التقارير
            </Link>
          )}

          {/* إدارة المناطق */}
          {(isAdmin || areasGroup.some(i => canShow(i.key))) && (
            <>
              <div
                className="rounded px-4 py-2 cursor-pointer flex justify-between items-center hover:bg-blue-100"
                onClick={() => setAreasOpen(!areasOpen)}
              >
                <span className="font-semibold">إدارة المناطق</span>
                {areasOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
              </div>

              {areasOpen && (
                <div className="ml-6 border-l">
                  {areasGroup.map(
                    i => canShow(i.key) && (
                      <Link key={i.key} to={i.path} onClick={onClose}
                        className={`${linkBase} mt-1 ${isPathActive(i.path) ? active : ""}`}>
                        {i.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* توصيل */}
          {(isAdmin || deliveryGroup.some(i => canShow(i.key))) && (
            <>
              <div
                className="rounded px-4 py-2 cursor-pointer flex justify-between items-center hover:bg-blue-100"
                onClick={() => setDeliveryOpen(!deliveryOpen)}
              >
                <span className="font-semibold">توصيل</span>
                {deliveryOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
              </div>

              {deliveryOpen && (
                <div className="ml-6 border-l">
                  {deliveryGroup.map(
                    i => canShow(i.key) && (
                      <Link key={i.key} to={i.path} onClick={onClose}
                        className={`${linkBase} mt-1 ${isPathActive(i.path) ? active : ""}`}>
                        {i.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* الوكلاء */}
          {(isAdmin || agentsGroup.some(i => canShow(i.key))) && (
            <>
              <div
                className="rounded px-4 py-2 cursor-pointer flex justify-between items-center hover:bg-blue-100"
                onClick={() => setAgentsOpen(!agentsOpen)}
              >
                <span className="font-semibold">الوكلاء</span>
                {agentsOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
              </div>

              {agentsOpen && (
                <div className="ml-6 border-l">
                  {agentsGroup.map(
                    i => canShow(i.key) && (
                      <Link key={i.key} to={i.path} onClick={onClose}
                        className={`${linkBase} mt-1 ${isPathActive(i.path) ? active : ""}`}>
                        {i.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* الإعدادات */}
          {(isAdmin || settingsGroup.some(i => canShow(i.key))) && (
            <>
              <div
                className="rounded px-4 py-2 cursor-pointer flex justify-between items-center hover:bg-blue-100"
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Settings size={16} /> الإعدادات
                </span>
                {settingsOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
              </div>

              {settingsOpen && (
                <div className="ml-6 border-l">
                  {settingsGroup.map(
                    i => canShow(i.key) && (
                      <Link key={i.key} to={i.path} onClick={onClose}
                        className={`${linkBase} mt-1 flex items-center gap-2 ${
                          isPathActive(i.path) ? active : ""
                        }`}>
                        {i.key === "stores" && <Store size={14} />}
                        {i.key === "payment" && <CreditCard size={14} />}
                        {i.key === "currency" && <DollarSign size={14} />}
                        <span>{i.label}</span>
                      </Link>
                    )
                  )}
                </div>
              )}
            </>
          )}
            {/* ✅ الحسابات (صفحة واحدة فقط) */}
          {canShow("accounts") && (
            <Link to="/accounts" onClick={onClose}
              className={`${linkBase} ${isPathActive("/accounts") ? active : ""}`}>
              الحسابات
            </Link>
          )}

        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

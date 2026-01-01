import { Link, Outlet, useLocation } from "react-router-dom";
import {
  BookOpen,
  Repeat,
  ClipboardList,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Layers,
  Landmark,
  Building2,
  Users,
  ShieldCheck,
} from "lucide-react";

const setupTabs = [
  { label: "دليل الحسابات", path: "setup/accounts", icon: BookOpen },
  { label: "العملات", path: "setup/currencies", icon: Repeat },
  { label: "أنواع قيود اليومية", path: "setup/journal-types", icon: ClipboardList },
  { label: "أنواع سندات القبض", path: "setup/receipt-types", icon: ArrowUpCircle },
  { label: "أنواع سندات الصرف", path: "setup/payment-types", icon: ArrowDownCircle },
  { label: "الصناديق النقدية", path: "setup/cash-boxes", icon: Wallet },
  { label: "مجموعات الصناديق", path: "setup/cash-box-groups", icon: Layers },
  { label: "دليل البنوك", path: "setup/banks", icon: Landmark },
  { label: "مجموعة البنوك", path: "setup/bank-groups", icon: Building2 },
  { label: "مجموعة الحسابات", path: "setup/account-groups", icon: Users },
  { label: "تسقيف الحسابات", path: "setup/account-ceiling", icon: ShieldCheck },
];

const Accounting = () => {
  const location = useLocation();

  const isSetup = location.pathname.includes("/accounts/setup");
  const isOperations = location.pathname.includes("/accounts/operations");

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold">الحسابات</h1>

      {/* تبويبات الأب */}
      <div className="flex gap-6 border-b pb-2 text-sm font-semibold">
        <Link
          to="/accounts/setup/accounts"
          className={
            isSetup
              ? "text-green-700 border-b-2 border-green-700 pb-1"
              : "text-gray-400"
          }
        >
          التهيئة
        </Link>

        <Link
          to="/accounts/operations/receipt-voucher"
          className={
            isOperations
              ? "text-green-700 border-b-2 border-green-700 pb-1"
              : "text-gray-400"
          }
        >
          العمليات
        </Link>

        <span className="text-gray-400">التقارير</span>
        <span className="text-gray-400">إدارة الترحيلات</span>
      </div>

      {/* ✅ شريط التهيئة – يظهر فقط في setup */}
      {isSetup && (
        <div className="bg-white rounded shadow px-4 py-3 flex flex-wrap gap-4">
          {setupTabs.map((tab) => {
            const Icon = tab.icon;
            const active = location.pathname.endsWith(tab.path);

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold transition
                  ${
                    active
                      ? "bg-green-100 text-green-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <Icon size={18} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* المحتوى */}
      <div className="bg-white rounded shadow p-6 min-h-[300px]">
        <Outlet />
      </div>
    </div>
  );
};

export default Accounting;

import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

// الصفحات العامة
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Types from "./pages/Types";
import Customers from "./pages/Customers";
import Restaurants from "./pages/Restaurants";
import Captains from "./pages/Captains";
import Marketing from "./pages/Marketing";
import Reports from "./pages/Reports";
import Categories from "./pages/Categories";
import Units from "./pages/Units";
import Products from "./pages/Products";
import Users from "./pages/Users";
import Cities from "./pages/Cities";
import Neighborhoods from "./pages/Neighborhoods";

// الوكلاء
import Agents from "./pages/Agents";
import AgentGroups from "./pages/AgentGroups";
import AgentInfo from "./pages/AgentInfo";

// الحسابات (Layout)
import Accounting from "./pages/Accounting";

// الحسابات - التهيئة
import Currencies from "./pages/Setup/Currencies";
import Accounts from "./pages/Setup/Accounts";
import AccountGroups from "./pages/Setup/AccountGroups";
import AccountCategories from "./pages/Setup/AccountCeiling";
import Banks from "./pages/Setup/Banks";
import BankGroups from "./pages/Setup/BankGroups";
import CashBoxes from "./pages/Setup/CashBoxes"; 
import CashBoxGroups from "./pages/Setup/CashBoxGroups";
import ReceiptTypes from "./pages/Setup/ReceiptTypes";
import PaymentTypes from "./pages/Setup/PaymentTypes";
import JournalTypes from "./pages/Setup/JournalTypes";

// العمليات
import Operations from "./pages/Operations";
import ReceiptVoucher from "./pages/Operations/ReceiptVoucher";
import PaymentVoucher from "./pages/Operations/PaymentVoucher";
import JournalEntry from "./pages/Operations/JournalEntry";


// الإعدادات ✅
import Settings from "./pages/Settings";

// الحماية
import ProtectedRoute from "./routes/ProtectedRoute";
import AccountCeiling from "./pages/Setup/AccountCeiling";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);

    const handleStorage = () => {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /* =========================
     غير مسجل دخول
  ========================= */
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  /* =========================
     التطبيق
  ========================= */
  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            {/* الصفحات العامة */}
            <Route
              path="/"
              element={
                <ProtectedRoute section="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/orders" element={<ProtectedRoute section="orders"><Orders /></ProtectedRoute>} />
            <Route path="/types" element={<ProtectedRoute section="types"><Types /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute section="customers"><Customers /></ProtectedRoute>} />
            <Route path="/restaurants" element={<ProtectedRoute section="restaurants"><Restaurants /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute section="products"><Products /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute section="categories"><Categories /></ProtectedRoute>} />
            <Route path="/units" element={<ProtectedRoute section="units"><Units /></ProtectedRoute>} />
            <Route path="/captains" element={<ProtectedRoute section="captains"><Captains /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute section="marketing"><Marketing /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute section="reports"><Reports /></ProtectedRoute>} />
            <Route path="/cities" element={<ProtectedRoute section="cities"><Cities /></ProtectedRoute>} />
            <Route path="/neighborhoods" element={<ProtectedRoute section="neighborhoods"><Neighborhoods /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute section="users"><Users /></ProtectedRoute>} />

            {/* =========================
   العمليات
========================= */}
<Route
  path="/accounts"
  element={
    <ProtectedRoute section="accounts">
      <Accounting />
    </ProtectedRoute>
  }
>
  {/* التهيئة */}
  <Route path="setup/*" element={<Outlet />} />

  {/* العمليات */}
  <Route path="operations" element={<Operations />}>
    <Route path="receipt-voucher" element={<ReceiptVoucher />} />
    <Route path="payment-voucher" element={<PaymentVoucher />} />
    <Route path="journal-entry" element={<JournalEntry />} />
  </Route>
</Route>



            {/* الوكلاء */}
            <Route path="/agents" element={<ProtectedRoute section="agents"><Agents /></ProtectedRoute>} />
            <Route path="/agents/info" element={<ProtectedRoute section="agent_info"><AgentInfo /></ProtectedRoute>} />
            <Route path="/agents/groups" element={<ProtectedRoute section="agent_groups"><AgentGroups /></ProtectedRoute>} />

            {/* =========================
               الإعدادات ✅ (تمت الإضافة)
            ========================= */}
            <Route
              path="/settings/:tab"
              element={
                <ProtectedRoute section="settings">
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={<Navigate to="/settings/stores" replace />}
            />

            {/* =========================
               الحسابات (Layout ثابت)
            ========================= */}
            <Route
              path="/accounts"
              element={
                <ProtectedRoute section="accounts">
                  <Accounting />
                </ProtectedRoute>
              }
            >
              <Route path="setup/accounts" element={<Accounts />} />
              <Route path="setup/currencies" element={<Currencies />} />
              <Route path="setup/account-groups" element={<AccountGroups />} />
              <Route path="setup/account-ceiling" element={<AccountCeiling />} />
              <Route path="setup/banks" element={<Banks />} />
              <Route path="setup/bank-groups" element={<BankGroups />} />
              <Route path="setup/cash-boxes" element={<CashBoxes />} />
              <Route path="setup/cash-box-groups" element={<CashBoxGroups />} />
              <Route path="setup/receipt-types" element={<ReceiptTypes />} />
              <Route path="setup/payment-types" element={<PaymentTypes />} />
              <Route path="setup/journal-types" element={<JournalTypes />} />
            </Route>

            {/* أخطاء */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Unauthorized />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

import React from "react";
import { useLocation, Navigate } from "react-router-dom";

import StoresSettings from "./StoresSettings";
import PaymentSettings from "./PaymentSettings";
import CurrencySettings from "./CurrencySettings";
import BranchesSettings from "./BranchesSettings";

type Tab = "stores" | "payment" | "currency" | "branches";

const Settings: React.FC = () => {
  const location = useLocation();

  // 🔗 تحديد التبويب من المسار
  const currentTab = location.pathname.split("/")[2] as Tab | undefined;

  // في حال تبويب غير معروف
  if (!currentTab) {
    return <Navigate to="/settings/stores" replace />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {currentTab === "stores" && <StoresSettings />}
      {currentTab === "payment" && <PaymentSettings />}
      {currentTab === "currency" && <CurrencySettings />}
      {currentTab === "branches" && <BranchesSettings />}
    </div>
  );
};

export default Settings;

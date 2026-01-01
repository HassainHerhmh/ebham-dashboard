import React, { useState } from "react";

const CurrencySettings: React.FC = () => {
  const [currency, setCurrency] = useState("SAR");

  const saveCurrency = () => {
    alert(`✅ تم حفظ العملة: ${currency}`);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-lg font-bold">تحديد عملة النظام</h2>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="border p-2 w-full rounded"
      >
        <option value="YER">ريال يمني</option>
        <option value="SAR">ريال سعودي</option>
        <option value="USD">دولار أمريكي</option>
      </select>
      <button
        onClick={saveCurrency}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        حفظ العملة
      </button>
    </div>
  );
};

export default CurrencySettings;
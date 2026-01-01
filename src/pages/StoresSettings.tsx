import React, { useState, useEffect } from "react";
import api from "../services/api";

const daysOfWeek = [
  "السبت", "الأحد", "الإثنين",
  "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"
];

const StoresSettings: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [storeName, setStoreName] = useState("");
  const [cashOnDelivery, setCashOnDelivery] = useState(false);
  const [schedule, setSchedule] = useState(
    daysOfWeek.map(day => ({ day, start_time: "", end_time: "", closed: false }))
  );
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [message, setMessage] = useState("");

  const loadStores = async () => {
    try {
      const data = await api.stores.getStores();
      if (data.success) {
        setStores(data.stores);
      } else {
        setMessage(data.message || "❌ خطأ في جلب المتاجر");
      }
    } catch {
      setMessage("❌ فشل الاتصال بالسيرفر");
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const saveStore = async () => {
    if (!storeName) {
      alert("❌ اسم المتجر مطلوب");
      return;
    }
    try {
      let res;
      if (editingStore) {
        res = await api.stores.updateStore(editingStore.id, {
          name: storeName,
          cash_on_delivery: cashOnDelivery,
          schedule
        });
      } else {
        res = await api.stores.addStore({
          name: storeName,
          cash_on_delivery: cashOnDelivery,
          schedule
        });
      }
      setMessage(res.message || "✅ تم الحفظ");
      resetForm();
      loadStores();
    } catch {
      setMessage("❌ خطأ أثناء الحفظ");
    }
  };

  const deleteStore = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المتجر؟")) return;
    try {
      const res = await api.stores.deleteStore(id);
      setMessage(res.message || "🗑️ تم الحذف");
      loadStores();
    } catch {
      setMessage("❌ خطأ أثناء الحذف");
    }
  };

  const startEdit = async (store: any) => {
    setEditingStore(store);
    setStoreName(store.name);
    setCashOnDelivery(!!store.cash_on_delivery);

    try {
      const data = await api.stores.getStore(store.id);
      if (data.success) {
        setSchedule(
          data.hours.map((h: any) => ({
            day: h.day,
            start_time: h.start_time || "",
            end_time: h.end_time || "",
            closed: !!h.closed
          }))
        );
      }
    } catch {
      setMessage("❌ فشل في جلب أوقات العمل");
    }
  };

  const handleScheduleChange = (index: number, field: string, value: any) => {
    const newSchedule = [...schedule];
    (newSchedule as any)[index][field] = value;
    setSchedule(newSchedule);
  };

  const resetForm = () => {
    setEditingStore(null);
    setStoreName("");
    setCashOnDelivery(false);
    setSchedule(daysOfWeek.map(day => ({ day, start_time: "", end_time: "", closed: false })));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-lg font-bold">
        {editingStore ? "تعديل متجر" : "إضافة متجر"}
      </h2>
      {message && <div className="text-blue-600">{message}</div>}

      <input
        className="border p-2 w-full rounded"
        placeholder="اسم المتجر"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cashOnDelivery}
          onChange={(e) => setCashOnDelivery(e.target.checked)}
        />
        الدفع عند الاستلام
      </label>

      <h3 className="font-semibold">أوقات العمل</h3>
      {schedule.map((dayData, index) => (
        <div key={dayData.day} className="flex items-center gap-2 mb-2">
          <span className="w-20">{dayData.day}</span>
          <input
            type="time"
            disabled={dayData.closed}
            value={dayData.start_time}
            onChange={(e) => handleScheduleChange(index, "start_time", e.target.value)}
            className="border p-1 rounded"
          />
          <input
            type="time"
            disabled={dayData.closed}
            value={dayData.end_time}
            onChange={(e) => handleScheduleChange(index, "end_time", e.target.value)}
            className="border p-1 rounded"
          />
          <label>
            <input
              type="checkbox"
              checked={dayData.closed}
              onChange={(e) => handleScheduleChange(index, "closed", e.target.checked)}
            /> مغلق
          </label>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={saveStore}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {editingStore ? "حفظ التعديل" : "إضافة المتجر"}
        </button>
        {editingStore && (
          <button
            onClick={resetForm}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            إلغاء التعديل
          </button>
        )}
      </div>

      <h3 className="font-semibold mt-4">المتاجر المسجلة</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>الاسم</th>
            <th>الدفع عند الاستلام</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {stores.length > 0 ? (
            stores.map((store) => (
              <tr key={store.id} className="border-t">
                <td className="p-2">{store.name}</td>
                <td className="p-2">{store.cash_on_delivery ? "✅ نعم" : "❌ لا"}</td>
                <td className="p-2 flex gap-4">
                  <button
                    onClick={() => startEdit(store)}
                    className="text-blue-600"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => deleteStore(store.id)}
                    className="text-red-600"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="text-center p-4 text-gray-500">
                لا توجد متاجر مسجلة
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StoresSettings;
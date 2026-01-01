import React, { useEffect, useState } from "react";
import api from "../services/api";

/* =========================
   Types
========================= */
interface City {
  id: number;
  name: string;
  delivery_fee: number;
  neighborhoods: number; // عدد الأحياء
}

/* =========================
   Component
========================= */
const Cities: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [name, setName] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  /* =========================
     Fetch Cities
  ========================= */
  const fetchCities = async () => {
    setLoading(true);
    try {
      const res = await api.cities.getCities();

      // نتأكد أن البيانات مصفوفة
      setCities(Array.isArray(res.cities) ? res.cities : []);
    } catch (err) {
      console.error("❌ خطأ في جلب المدن:", err);
      setCities([]);
    } finally {
      setLoading(false);
    } 
  };

 /* =========================
   Add City
========================= */
const addCity = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!name || deliveryFee < 0) return;

  try {
    await api.cities.addCity(name, deliveryFee);

    setName("");
    setDeliveryFee(0);
    fetchCities();
  } catch (err) {
    console.error("❌ خطأ في إضافة المدينة:", err);
  }
};

  /* =========================
     Delete City
  ========================= */
  const deleteCity = async (id: number) => {
    if (!window.confirm("⚠️ هل تريد حذف المدينة؟")) return;

    try {
      await api.cities.deleteCity(id);
      fetchCities();
    } catch (err) {
      console.error("❌ خطأ في حذف المدينة:", err);
    }
  };

  /* =========================
     Helpers
  ========================= */
  const renderNeighborhoods = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && !isNaN(Number(value)))
      return Number(value);
    if (Array.isArray(value)) return value.length;
    return 0;
  };

  /* =========================
     Lifecycle
  ========================= */
  useEffect(() => {
    fetchCities();
  }, []);

  /* =========================
     Render
  ========================= */
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">إدارة المدن</h1>

      {/* إضافة مدينة */}
      <form onSubmit={addCity} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="اسم المدينة"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border px-3 py-2 rounded w-1/3"
          required
        />

        <input
          type="number"
          placeholder="سعر التوصيل"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(Number(e.target.value))}
          className="border px-3 py-2 rounded w-1/3"
          required
        />

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          إضافة
        </button>
      </form>

      {/* الجدول */}
      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">#</th>
              <th>المدينة</th>
              <th>سعر التوصيل</th>
              <th>عدد الأحياء</th>
              <th>إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {cities.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  لا توجد مدن
                </td>
              </tr>
            ) : (
              cities.map((city, index) => (
                <tr key={city.id} className="border-b">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td>{city.name}</td>
                  <td>{city.delivery_fee}</td>
                  <td>{renderNeighborhoods(city.neighborhoods)}</td>
                  <td>
                    <button
                      onClick={() => deleteCity(city.id)}
                      className="text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Cities;

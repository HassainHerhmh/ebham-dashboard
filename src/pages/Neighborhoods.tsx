import React, { useEffect, useState } from "react";
import api from "../services/api";

/* =========================
   Interfaces
========================= */
interface Neighborhood {
  id: number;
  name: string;              // ✅ كان neighborhood_name
  delivery_fee: number;
  city_name?: string;
}

interface City {
  id: number;
  name: string;
}

/* =========================
   Component
========================= */
const Neighborhoods: React.FC = () => {
  const [search, setSearch] = useState("");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [editId, setEditId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [fee, setFee] = useState<number>(0);
  const [cityId, setCityId] = useState<number>(0);

  /* =========================
     Fetch Neighborhoods
  ========================= */
  const fetchNeighborhoods = async (query: string) => {
    try {
      setLoading(true);
      const res = await api.cities.searchNeighborhoods(query);
      if (res?.success && Array.isArray(res.neighborhoods)) {
        setNeighborhoods(res.neighborhoods);
      } else {
        setNeighborhoods([]);
      }
    } catch (err) {
      console.error("❌ خطأ جلب الأحياء:", err);
      setNeighborhoods([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Fetch Cities
  ========================= */
  const fetchCities = async () => {
    try {
      const res = await api.cities.getCities();
      if (res?.success && Array.isArray(res.cities)) {
        setCities(res.cities);
      }
    } catch (err) {
      console.error("❌ خطأ جلب المدن:", err);
    }
  };

  useEffect(() => {
    fetchCities();
    fetchNeighborhoods("");
  }, []);

  /* =========================
     Edit
  ========================= */
  const startEdit = (n: Neighborhood) => {
    setEditId(n.id);
    setName(n.name);
    setFee(n.delivery_fee);

    const cityObj = cities.find((c) => c.name === n.city_name);
    setCityId(cityObj?.id || 0);

    setIsModalOpen(true);
  };

  /* =========================
     Save
  ========================= */
  const saveNeighborhood = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editId) {
        await api.cities.updateNeighborhood(editId, name, fee, cityId);
      } else {
        await api.cities.addNeighborhood(cityId, name, fee);
      }

      setIsModalOpen(false);
      setEditId(null);
      setName("");
      setFee(0);
      setCityId(0);

      fetchNeighborhoods(search);
    } catch (err) {
      console.error("❌ خطأ حفظ الحي:", err);
    }
  };

  /* =========================
     Delete
  ========================= */
  const deleteNeighborhood = async (id: number) => {
    if (!window.confirm("⚠️ هل أنت متأكد من حذف الحي؟")) return;

    try {
      await api.cities.deleteNeighborhood(id);
      fetchNeighborhoods(search);
    } catch (err) {
      console.error("❌ خطأ حذف الحي:", err);
    }
  };

  /* =========================
     Render
  ========================= */
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">إدارة الأحياء</h1>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => {
            setEditId(null);
            setName("");
            setFee(0);
            setCityId(0);
            setIsModalOpen(true);
          }}
        >
          ➕ إضافة حي
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          fetchNeighborhoods(e.target.value);
        }}
        placeholder="اكتب اسم الحي..."
        className="border px-3 py-2 rounded w-1/2 mb-4"
      />

      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th>#</th>
              <th>اسم الحي</th>
              <th>سعر التوصيل</th>
              <th>المدينة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {neighborhoods.map((n, idx) => (
              <tr key={n.id} className="border-b">
                <td>{idx + 1}</td>
                <td>{n.name}</td>
                <td>{n.delivery_fee}</td>
                <td>{n.city_name || "-"}</td>
                <td>
                  <button
                    onClick={() => startEdit(n)}
                    className="text-blue-600 mx-1"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => deleteNeighborhood(n.id)}
                    className="text-red-600 mx-1"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
            {!neighborhoods.length && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  لا توجد بيانات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* =========================
          Modal
      ========================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">
              {editId ? "تعديل الحي" : "إضافة حي جديد"}
            </h2>

            <form onSubmit={saveNeighborhood} className="space-y-4">
              <select
                value={cityId}
                onChange={(e) => setCityId(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value={0}>-- اختر مدينة --</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم الحي"
                className="w-full border rounded px-3 py-2"
                required
              />

              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                placeholder="سعر التوصيل"
                className="w-full border rounded px-3 py-2"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Neighborhoods;
 
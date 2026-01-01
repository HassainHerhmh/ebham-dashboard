import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { API_URL } from "../config";

interface TypeItem {
  id: number;
  name: string;
  image_url?: string;
  sort_order?: number;
  created_at?: string;
}

const Types: React.FC = () => {
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [image, setImage] = useState<File | null>(null);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/types`);
      const data = await res.json();
      if (data.success && Array.isArray(data.types)) {
        setTypes(data.types);
        setError(null);
      } else {
        setError("🚫 لا توجد أنواع");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const startEditType = (t: TypeItem) => {
    setEditId(t.id);
    setName(t.name);
    setSortOrder(t.sort_order || 0);
    setImage(null);
    setIsModalOpen(true);
  };

  const saveType = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("sort_order", String(sortOrder));
    if (image) formData.append("image", image);

    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `${API_URL}/types/${editId}`
      : `${API_URL}/types`;

    try {
      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "✅ تم الحفظ");
        setIsModalOpen(false);
        setEditId(null);
        setName("");
        setSortOrder(0);
        setImage(null);
        fetchTypes();
      } else {
        alert(data.message || "❌ فشل الحفظ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteType = async (id: number) => {
    if (!window.confirm("⚠️ هل تريد حذف هذا النوع؟")) return;
    try {
      const res = await fetch(`${API_URL}/types/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("🗑️ تم الحذف");
        fetchTypes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          📑 الأنواع
        </h1>
        <button
          onClick={() => {
            setEditId(null);
            setName("");
            setSortOrder(0);
            setImage(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> إضافة نوع جديد
        </button>
      </div>

      {/* الجدول */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">⏳ جاري التحميل...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : types.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">اسم النوع</th>
                <th className="p-3">الصورة</th>
                <th className="p-3">الترتيب</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id}>
                  <td className="p-3">#{t.id}</td>
                  <td className="p-3">{t.name}</td>
                  <td className="p-3">
                    {t.image_url ? (
                      <img
                        src={`${API_URL}${t.image_url}`}
                        alt={t.name}
                        className="w-16 h-16 object-cover rounded mx-auto"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3">{t.sort_order ?? 0}</td>
                  <td className="p-3 flex gap-2 justify-center">
                    <button
                      onClick={() => startEditType(t)}
                      className="bg-blue-500 text-white px-2 rounded"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => deleteType(t.id)}
                      className="bg-red-500 text-white px-2 rounded"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center">🚫 لا توجد أنواع</div>
        )}
      </div>

      {/* المودال */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">
              {editId ? "تعديل النوع" : "إضافة نوع جديد"}
            </h2>
            <form onSubmit={saveType} className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم النوع"
                className="border p-2 w-full"
                required
              />
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                placeholder="ترتيب العرض"
                className="border p-2 w-full"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="border p-2 w-full"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Types;
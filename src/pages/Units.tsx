import React, { useState, useEffect } from "react";
import axios from "axios";

interface Unit {
  id: number;
  name: string;
}

const API_URL = "http://localhost:5000";

const Units: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nameValue, setNameValue] = useState("");

  const fetchUnits = async () => {
    try {
      const res = await axios.get(`${API_URL}/units`);
      setUnits(res.data);
    } catch (err) {
      alert("❌ فشل في جلب البيانات");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSave = async () => {
    if (!nameValue.trim()) {
      alert("❌ يرجى إدخال اسم الوحدة");
      return;
    }
    try {
      if (editId) {
        await axios.put(`${API_URL}/units/${editId}`, { name: nameValue });
        alert("✅ تم تعديل الوحدة");
      } else {
        await axios.post(`${API_URL}/units`, { name: nameValue });
        alert("✅ تم إضافة الوحدة");
      }
      setShowModal(false);
      setEditId(null);
      setNameValue("");
      fetchUnits();
    } catch (err) {
      alert("❌ حدث خطأ أثناء الحفظ");
      console.error(err);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditId(unit.id);
    setNameValue(unit.name);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("هل تريد حذف هذه الوحدة؟")) return;
    try {
      await axios.delete(`${API_URL}/units/${id}`);
      alert("🗑 تم حذف الوحدة");
      fetchUnits();
    } catch (err) {
      alert("❌ حدث خطأ أثناء الحذف");
      console.error(err);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">⚖️ إدارة الوحدات</h2>
        <button
          onClick={() => {
            setEditId(null);
            setNameValue("");
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ إضافة وحدة جديدة
        </button>
      </div>

      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">الاسم</th>
            <th className="border p-2">خيارات</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u, index) => (
            <tr key={u.id}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{u.name}</td>
              <td className="border p-2 flex gap-2 justify-center">
                <button
                  onClick={() => handleEdit(u)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editId ? "تعديل الوحدة" : "إضافة وحدة جديدة"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✖
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">اسم الوحدة</label>
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="مثال: حبة"
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  حفظ 💾
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Units;
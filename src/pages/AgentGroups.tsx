import React, { useEffect, useState } from "react";
import api from "../services/api";

interface AgentGroup {
  id: number;
  name: string;
  code: string;
  status?: string;
}

const AgentGroups: React.FC = () => {
  const [groups, setGroups] = useState<AgentGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<AgentGroup[]>([]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* =========================
     جلب المجموعات
  ========================= */
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await api.agentGroups.getGroups();
      setGroups(data);
      setFilteredGroups(data);
    } catch (err) {
      console.error("❌ فشل جلب المجموعات", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  /* =========================
     البحث
  ========================= */
  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredGroups(
      groups.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.code.toLowerCase().includes(q)
      )
    );
  }, [search, groups]);

  /* =========================
     إضافة مجموعة
  ========================= */
  const handleAdd = async () => {
    if (!name || !code) {
      alert("الاسم والرمز مطلوبان");
      return;
    }

    try {
      await api.agentGroups.addGroup({ name, code });
      setName("");
      setCode("");
      setIsModalOpen(false);
      fetchGroups();
    } catch (err) {
      alert("❌ الرمز مستخدم مسبقًا");
    }
  };

  /* =========================
     حذف مجموعة
  ========================= */
  const handleDelete = async (id: number) => {
    if (!window.confirm("هل تريد حذف المجموعة؟")) return;

    await api.agentGroups.deleteGroup(id);
    fetchGroups();
  };

  /* =========================
     Render
  ========================= */
  return (
    <div className="space-y-6">

      {/* العنوان + زر الإضافة */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">مجموعات الوكلاء</h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          إضافة مجموعة
        </button>
      </div>

      {/* البحث */}
      <input
        type="text"
        placeholder="بحث بالاسم أو الرمز..."
        className="border p-2 rounded w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* جدول المجموعات */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">جاري التحميل...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            لا توجد نتائج
          </div>
        ) : (
          <table className="w-full text-right">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">الاسم</th>
                <th className="p-3">الرمز</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filteredGroups.map((g, i) => (
                <tr key={g.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">{g.name}</td>
                  <td className="p-3">{g.code}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* =========================
         نافذة الإضافة (Modal)
      ========================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg p-6 shadow-lg">

            <h2 className="text-xl font-bold mb-4">
              إضافة مجموعة وكلاء
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="اسم المجموعة"
                className="border p-2 rounded w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                type="text"
                placeholder="رمز المجموعة"
                className="border p-2 rounded w-full"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                إلغاء
              </button>

              <button
                onClick={handleAdd}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                حفظ
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AgentGroups;

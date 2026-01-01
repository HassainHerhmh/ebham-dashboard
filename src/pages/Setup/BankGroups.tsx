import React, { useEffect, useState } from "react";

/* =========================
   Types
========================= */
type BankGroup = {
  id: number;
  name_ar: string;
  name_en: string;
  code: string;
  user_name?: string;
};

/* =========================
   Component
========================= */
const BankGroups: React.FC = () => {
  const [groups, setGroups] = useState<BankGroup[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    code: "",
  });

  /* =========================
     Load Data
  ========================= */
  const loadGroups = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/bank-groups?search=${search}`
      );
      const data = await res.json();
      if (data.success) setGroups(data.groups);
    } catch (err) {
      console.error("Load bank groups error:", err);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [search]);

  /* =========================
     Reset Form
  ========================= */
  const resetForm = () => {
    setForm({ name_ar: "", name_en: "", code: "" });
    setEditId(null);
  };

  /* =========================
     Add / Edit
  ========================= */
  const handleSubmit = async () => {
    if (!form.name_ar || !form.code) {
      alert("الاسم والرقم مطلوبان");
      return;
    }

    if (editId) {
      await fetch(`http://localhost:5000/bank-groups/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("http://localhost:5000/bank-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setShowModal(false);
    resetForm();
    loadGroups();
  };

  /* =========================
     Edit
  ========================= */
  const handleEdit = (g: BankGroup) => {
    setEditId(g.id);
    setForm({
      name_ar: g.name_ar,
      name_en: g.name_en || "",
      code: g.code,
    });
    setShowModal(true);
  };

  /* =========================
     Delete
  ========================= */
  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;

    await fetch(`http://localhost:5000/bank-groups/${id}`, {
      method: "DELETE",
    });

    loadGroups();
  };

  return (
    <div className="space-y-4">
      {/* =========================
          CSS الطباعة (داخل الملف)
      ========================= */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            inset: 0;
            padding: 20px;
          }
          #print-area button {
            display: none !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
          }
          th {
            background: #e5e7eb !important;
            color: #000 !important;
          }
        }
      `}</style>

      {/* العنوان */}
      <h1 className="text-2xl font-bold">مجموعة البنوك</h1>

      {/* الأدوات */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="بحث"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2"
        />

        <div className="flex gap-2">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="rounded-lg bg-green-700 px-4 py-2 text-white"
          >
            ➕ إضافة
          </button>

          <button
            onClick={loadGroups}
            className="rounded-lg bg-green-600 px-4 py-2 text-white"
          >
            🔄 تحديث
          </button>

          <button
            onClick={() => window.print()}
            className="rounded-lg bg-green-500 px-4 py-2 text-white"
          >
            🖨️ طباعة
          </button>
        </div>
      </div>

      {/* =========================
          TABLE (مطابق للحسابات)
      ========================= */}
      <div
        id="print-area"
        className="overflow-x-auto rounded-lg bg-white shadow"
      >
        <table className="w-full border-collapse text-sm">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="border px-3 py-2">الاسم</th>
              <th className="border px-3 py-2">الاسم الأجنبي</th>
              <th className="border px-3 py-2">الرقم</th>
              <th className="border px-3 py-2">المستخدم</th>
              <th className="border px-3 py-2">اسم الفرع</th>
              <th className="border px-3 py-2">الإجراءات</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((g, index) => (
              <tr
                key={g.id}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
              >
                <td className="border px-3 py-2">{g.name_ar}</td>
                <td className="border px-3 py-2">{g.name_en || "-"}</td>
                <td className="border px-3 py-2 text-center">{g.code}</td>
                <td className="border px-3 py-2">
                  {g.user_name || "-"}
                </td>
                <td className="border px-3 py-2">المركز الرئيسي</td>
                <td className="border px-3 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(g)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!groups.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  لا توجد بيانات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =========================
          MODAL (Add / Edit)
      ========================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-[#eef4ee] p-6">
            <h2 className="mb-4 text-center text-xl font-bold">
              {editId ? "تعديل مجموعة بنك" : "إضافة مجموعة بنك"}
            </h2>

            <div className="space-y-3">
              <input
                placeholder="الاسم"
                className="w-full rounded-lg border px-3 py-2"
                value={form.name_ar}
                onChange={(e) =>
                  setForm({ ...form, name_ar: e.target.value })
                }
              />
              <input
                placeholder="الاسم الأجنبي"
                className="w-full rounded-lg border px-3 py-2"
                value={form.name_en}
                onChange={(e) =>
                  setForm({ ...form, name_en: e.target.value })
                }
              />
              <input
                placeholder="الرقم"
                className="w-full rounded-lg border px-3 py-2"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
              />
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => setShowModal(false)}>إلغاء</button>
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-green-700 px-6 py-2 text-white"
              >
                {editId ? "تعديل" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankGroups;

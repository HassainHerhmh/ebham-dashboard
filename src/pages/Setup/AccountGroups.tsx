import React, { useEffect, useState } from "react";

/* =========================
   Types
========================= */
type AccountGroup = {
  id: number;
  name_ar: string;
  name_en: string;
  code: string;
  user_name?: string;
  branch?: string;
};

/* =========================
   Component
========================= */
const AccountGroups: React.FC = () => {
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

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
        `http://localhost:5000/account-groups?search=${search}`
      );
      const data = await res.json();
      if (data.success) setGroups(data.groups);
    } catch (err) {
      console.error("Load groups error:", err);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [search]);

  /* =========================
     Add Group
  ========================= */
  const addGroup = async () => {
    if (!form.name_ar || !form.code) return;

    await fetch("http://localhost:5000/account-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setShowModal(false);
    setForm({ name_ar: "", name_en: "", code: "" });
    loadGroups();
  };

  /* =========================
     Print
  ========================= */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* =========================
          Print CSS (INLINE)
      ========================= */}
      <style>
        {`
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
            background: #f1f5f9 !important;
            color: #000 !important;
          }
        }
      `}
      </style>

      {/* العنوان */}
      <h1 className="text-2xl font-bold">مجموعة الحسابات</h1>

      {/* الأدوات */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="بحث"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
          >
            ➕ إضافة
          </button>

          <button
            onClick={loadGroups}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            🔄 تحديث
          </button>

          <button
            onClick={handlePrint}
            className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            🖨️ طباعة
          </button>
        </div>
      </div>

      {/* =========================
          TABLE (PRINT AREA)
      ========================= */}
      <div id="print-area">
        <div className="overflow-x-auto rounded-lg bg-white shadow">
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
                    {g.user_name || "—"}
                  </td>
                  <td className="border px-3 py-2">
                    {g.branch || "المركز الرئيسي"}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button className="text-green-600">✏️</button>
                      <button className="text-red-600">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}

              {!groups.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                    لا توجد بيانات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          ADD MODAL
      ========================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-[#eef4ee] p-6">
            <h2 className="mb-4 text-center text-xl font-bold">
              إضافة مجموعة حساب
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="الاسم"
                value={form.name_ar}
                onChange={(e) =>
                  setForm({ ...form, name_ar: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2"
              />

              <input
                type="text"
                placeholder="الاسم الأجنبي"
                value={form.name_en}
                onChange={(e) =>
                  setForm({ ...form, name_en: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2"
              />

              <input
                type="text"
                placeholder="الرقم"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                إلغاء الأمر
              </button>

              <button
                onClick={addGroup}
                className="rounded-lg bg-green-700 px-6 py-2 text-white hover:bg-green-800"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountGroups;

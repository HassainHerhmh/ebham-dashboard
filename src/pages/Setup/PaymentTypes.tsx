import React, { useEffect, useState } from "react";
import api from "../../services/api";

/* =========================
   Types
========================= */
type PaymentType = {
  id: number;
  code: number;
  name_ar: string;
  name_en: string | null;
  sort_order: number;
};

const PaymentTypes: React.FC = () => {
  const [rows, setRows] = useState<PaymentType[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    code: "",
    name_ar: "",
    name_en: "",
    sort_order: "",
  });

  /* =========================
     Load Data
  ========================= */
  const loadData = async () => {
    const res = await api.get("/payment-types", {
      params: { search },
    });

    if (res.data.success) {
      setRows(res.data.list);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  /* =========================
     Add / Update
  ========================= */
  const save = async () => {
    if (!form.code || !form.name_ar || !form.sort_order) {
      alert("الرقم والاسم والترتيب مطلوبة");
      return;
    }

    try {
      if (editId) {
        // ✏️ تعديل
        await api.put(`/payment-types/${editId}`, {
          name_ar: form.name_ar,
          name_en: form.name_en || null,
          sort_order: Number(form.sort_order),
        });
      } else {
        // ➕ إضافة
        await api.post("/payment-types", {
          code: Number(form.code),
          name_ar: form.name_ar,
          name_en: form.name_en || null,
          sort_order: Number(form.sort_order),
        });
      }

      setShowModal(false);
      setEditId(null);
      setForm({
        code: "",
        name_ar: "",
        name_en: "",
        sort_order: "",
      });

      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "حدث خطأ");
    }
  };

  /* =========================
     Delete
  ========================= */
  const remove = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;

    try {
      await api.delete(`/payment-types/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "لا يمكن الحذف");
    }
  };

  /* =========================
     Edit
  ========================= */
  const openEdit = (r: PaymentType) => {
    setEditId(r.id);
    setForm({
      code: String(r.code),
      name_ar: r.name_ar,
      name_en: r.name_en || "",
      sort_order: String(r.sort_order),
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">أنواع سندات الصرف</h1>

      {/* ===== Tools ===== */}
      <div className="flex justify-between items-center">
        {/* الأزرار يسار */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditId(null);
              setForm({
                code: "",
                name_ar: "",
                name_en: "",
                sort_order: "",
              });
              setShowModal(true);
            }}
            className="bg-green-700 text-white px-4 py-2 rounded"
          >
            ➕ إضافة
          </button>

          <button
            onClick={loadData}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            🔄 تحديث
          </button>

          <button
            onClick={() => window.print()}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            🖨️ طباعة
          </button>
        </div>

        {/* البحث يمين */}
        <input
          placeholder="بحث"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-lg w-64"
        />
      </div>

      {/* ===== Table ===== */}
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full text-sm border-collapse text-center">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="border px-3 py-2">الرقم</th>
              <th className="border px-3 py-2">الاسم</th>
              <th className="border px-3 py-2">الاسم الأجنبي</th>
              <th className="border px-3 py-2">الترتيب</th>
              <th className="border px-3 py-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-100"}
              >
                <td className="border px-3 py-2">{r.code}</td>
                <td className="border px-3 py-2">{r.name_ar}</td>
                <td className="border px-3 py-2">{r.name_en || "-"}</td>
                <td className="border px-3 py-2">{r.sort_order}</td>
                <td className="border px-3 py-2 space-x-2">
                  <button onClick={() => openEdit(r)}>✏️</button>
                  <button
                    onClick={() => remove(r.id)}
                    className="text-red-600"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td colSpan={5} className="py-6 text-gray-500">
                  لا توجد بيانات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#eef4ee] p-6 rounded w-[420px] space-y-2">
            <h2 className="text-xl font-bold text-center">
              {editId ? "تعديل نوع سند صرف" : "إضافة نوع سند صرف"}
            </h2>

            <input
              className="border p-2 w-full rounded"
              placeholder="الرقم"
              value={form.code}
              disabled={!!editId}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value })
              }
            />

            <input
              className="border p-2 w-full rounded"
              placeholder="الاسم"
              value={form.name_ar}
              onChange={(e) =>
                setForm({ ...form, name_ar: e.target.value })
              }
            />

            <input
              className="border p-2 w-full rounded"
              placeholder="الاسم الأجنبي"
              value={form.name_en}
              onChange={(e) =>
                setForm({ ...form, name_en: e.target.value })
              }
            />

            <input
              className="border p-2 w-full rounded"
              placeholder="الترتيب"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: e.target.value })
              }
            />

            <div className="flex justify-between pt-2">
              <button onClick={() => setShowModal(false)}>إلغاء</button>
              <button
                onClick={save}
                className="bg-green-700 text-white px-4 py-2 rounded"
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

export default PaymentTypes;

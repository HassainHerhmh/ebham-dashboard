import { useEffect, useState } from "react";
import api from "../../services/api";

/* =========================
   Types
========================= */
type Currency = {
  id: number;
  name_ar: string;
  code: string;
  symbol: string;
  exchange_rate: number;
  min_rate?: number | null;
  max_rate?: number | null;
  is_local: number; // 1 | 0
};

/* =========================
   Component
========================= */
const Currencies = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name_ar: "",
    code: "",
    symbol: "",
    exchange_rate: "",
    min_rate: "",
    max_rate: "",
    is_local: false,
  });

  /* =========================
     Load
  ========================= */
  const loadCurrencies = async () => {
    setLoading(true);
    const res = await api.currencies.getAll();
    setCurrencies(res || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  /* =========================
     Filter
  ========================= */
  const filtered = currencies.filter(
    (c) =>
      c.name_ar.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================
     Reset Form
  ========================= */
  const resetForm = () => {
    setForm({
      name_ar: "",
      code: "",
      symbol: "",
      exchange_rate: "",
      min_rate: "",
      max_rate: "",
      is_local: false,
    });
    setEditId(null);
  };

  /* =========================
     Add / Update
  ========================= */
  const handleSave = async () => {
    if (!form.name_ar || !form.code) {
      alert("اسم العملة والرمز الأجنبي مطلوبان");
      return;
    }

const payload = {
  name_ar: form.name_ar,
  code: form.code,
  symbol: form.symbol,
  exchange_rate: Number(form.exchange_rate),
  min_rate: form.min_rate ? Number(form.min_rate) : null,
  max_rate: form.max_rate ? Number(form.max_rate) : null,
 is_local: Boolean(form.is_local),

};


    try {
      if (editId) {
        await api.currencies.update(editId, payload);
      } else {
        await api.currencies.create(payload);
      }

      setShowModal(false);
      resetForm();
      loadCurrencies();
    } catch (err) {
      alert("حصل خطأ أثناء الحفظ");
    }
  };

  /* =========================
     Edit
  ========================= */
  const handleEdit = (c: Currency) => {
    setEditId(c.id);
    setForm({
      name_ar: c.name_ar,
      code: c.code,
      symbol: c.symbol,
      exchange_rate: String(c.exchange_rate),
      min_rate: c.min_rate ? String(c.min_rate) : "",
      max_rate: c.max_rate ? String(c.max_rate) : "",
      is_local: c.is_local === 1,
    });
    setShowModal(true);
  };

  /* =========================
     Delete
  ========================= */
  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف العملة؟")) return;
    await api.currencies.delete(id);
    loadCurrencies();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-right">العملات</h1>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <input
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-64"
        />

        <div className="flex gap-2">
          <button
            onClick={loadCurrencies}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            تحديث
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            إضافة عملة +
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-2">الرقم</th>
              <th className="p-2">اسم العملة</th>
              <th className="p-2">الرمز الأجنبي</th>
              <th className="p-2">الرمز العربي</th>
              <th className="p-2">الترتيب</th>
              <th className="p-2">معامل التحويل</th>
              <th className="p-2">سعر التحويل</th>
              <th className="p-2">الحد الأدنى</th>
              <th className="p-2">الحد الأعلى</th>
              <th className="p-2">محلية؟</th>
              <th className="p-2">إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={11} className="p-4 text-center">
                  جاري التحميل...
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((c, index) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{c.id}</td>
                  <td className="p-2">{c.name_ar}</td>
                  <td className="p-2">{c.code}</td>
                  <td className="p-2">{c.symbol}</td>
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">*</td>
                  <td className="p-2">{c.exchange_rate}</td>
                  <td className="p-2">{c.min_rate ?? "—"}</td>
                  <td className="p-2">{c.max_rate ?? "—"}</td>
                  <td className="p-2">{c.is_local ? "نعم" : "لا"}</td>
                  <td className="p-2 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-green-600"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[500px] space-y-4">
            <h2 className="font-bold text-lg">
              {editId ? "تعديل عملة" : "إضافة عملة"}
            </h2>

            <input
              placeholder="اسم العملة"
              className="border rounded w-full p-2"
              value={form.name_ar}
              onChange={(e) =>
                setForm({ ...form, name_ar: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="الرمز الأجنبي"
                className="border rounded p-2"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
              />
              <input
                placeholder="الرمز العربي"
                className="border rounded p-2"
                value={form.symbol}
                onChange={(e) =>
                  setForm({ ...form, symbol: e.target.value })
                }
              />
            </div>

            <input
              placeholder="سعر التحويل"
              type="number"
              className="border rounded w-full p-2"
              value={form.exchange_rate}
              onChange={(e) =>
                setForm({ ...form, exchange_rate: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="الحد الأدنى"
                type="number"
                className="border rounded p-2"
                value={form.min_rate}
                onChange={(e) =>
                  setForm({ ...form, min_rate: e.target.value })
                }
              />
              <input
                placeholder="الحد الأعلى"
                type="number"
                className="border rounded p-2"
                value={form.max_rate}
                onChange={(e) =>
                  setForm({ ...form, max_rate: e.target.value })
                }
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_local}
                onChange={(e) =>
                  setForm({ ...form, is_local: e.target.checked })
                }
              />
              عملة محلية
            </label>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded"
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

export default Currencies;

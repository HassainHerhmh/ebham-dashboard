import React, { useEffect, useState } from "react";
import api from "../../services/api";

/* =========================
   Journal Entry (UI Only)
========================= */

type Account = {
  id: number;
  code: string;
  name_ar: string;
};

type Currency = {
  id: number;
  name_ar: string;
  code: string;
};

const today = new Date().toLocaleDateString("en-CA");

const JournalEntry: React.FC = () => {
  /* =========================
     State
  ========================= */
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [notes, setNotes] = useState("");

  // مدين
  const [fromAccount, setFromAccount] = useState("");
  const [fromAccountName, setFromAccountName] = useState("");

  // دائن
  const [toAccount, setToAccount] = useState("");
  const [toAccountName, setToAccountName] = useState("");

  /* ===== فلاتر الجدول ===== */
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState(today);
  const [allDates, setAllDates] = useState(false);

  /* =========================
     Load Data
  ========================= */
  useEffect(() => {
    fetchAccounts();
    fetchCurrencies();
  }, []);

  const fetchAccounts = async () => {
    const res = await api.get("/accounts");
    const data =
      res.data?.accounts ||
      res.data?.list ||
      res.data?.data ||
      res.data ||
      [];
    setAccounts(Array.isArray(data) ? data : []);
  };

  const fetchCurrencies = async () => {
    const res = await api.get("/currencies");
    const data =
      res.data?.currencies ||
      res.data?.list ||
      res.data?.data ||
      res.data ||
      [];
    setCurrencies(Array.isArray(data) ? data : []);
  };

  const getAccountCode = (id: string) => {
    return accounts.find(a => a.id === Number(id))?.code || "";
  };

  /* =========================
     Save (UI Only)
  ========================= */
const saveEntry = async () => {
  if (!fromAccount || !toAccount || !amount || !currencyId) {
    alert("يرجى إدخال جميع البيانات الأساسية");
    return;
  }

  try {
    const baseData = {
      journal_type_id: 1,          // ✅ قيد يومي
      reference_type: "manual",    // ✅ قيد يدوي
      reference_id: null,
      journal_date: date,
      currency_id: Number(currencyId),
      notes: notes || "قيد يومي",
      cost_center_id: null,
    };

    // 🔹 مدين
    await api.post("/journal-entries", {
      ...baseData,
      account_id: Number(fromAccount),
      debit: Number(amount),
      credit: 0,
    });

    // 🔹 دائن
    await api.post("/journal-entries", {
      ...baseData,
      account_id: Number(toAccount),
      debit: 0,
      credit: Number(amount),
    });

    alert("✅ تم حفظ القيد اليومي بنجاح");

    // تفريغ الفورم
    setAmount("");
    setCurrencyId("");
    setFromAccount("");
    setFromAccountName("");
    setToAccount("");
    setToAccountName("");
    setNotes("");

  } catch (err: any) {
    console.error(err);
    alert(err.response?.data?.message || "❌ خطأ في حفظ القيد");
  }
};


/*======================
==================*/
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
 
      {/* ================= Form ================= */}
     <h2 className="text-xl font-bold text-center mb-4">
  إضافة قيد يومي
</h2>


      <div className="grid grid-cols-3 gap-4">
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <select
          className="input"
          value={currencyId}
          onChange={(e) => setCurrencyId(e.target.value)}
        >
          <option value="">-- العملة --</option>
          {currencies.map(c => (
            <option key={c.id} value={c.id}>
              {c.name_ar} ({c.code})
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="المبلغ"
          className="input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col items-center gap-2">
          <input
            list="accountsList"
            className="input w-full text-center text-lg"
            placeholder="🔍 الحساب المدين"
            value={fromAccountName}
            onChange={(e) => {
              setFromAccountName(e.target.value);
              const acc = accounts.find(a => a.name_ar === e.target.value);
              setFromAccount(acc ? String(acc.id) : "");
            }}
          />
          <input
            disabled
            className="input bg-gray-100 text-center w-40"
            placeholder="كود الحساب"
            value={getAccountCode(fromAccount)}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <input
            list="accountsList"
            className="input w-full text-center text-lg"
            placeholder="🔍 الحساب الدائن"
            value={toAccountName}
            onChange={(e) => {
              setToAccountName(e.target.value);
              const acc = accounts.find(a => a.name_ar === e.target.value);
              setToAccount(acc ? String(acc.id) : "");
            }}
          />
          <input
            disabled
            className="input bg-gray-100 text-center w-40"
            placeholder="كود الحساب"
            value={getAccountCode(toAccount)}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <textarea
          className="notes-box"
          placeholder="ملاحظات"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      
      {/* ================= Actions تحت النموذج ================= */}
      <div className="flex justify-end gap-2 bg-[#e9efe6] p-4 rounded-lg">
  <button
    onClick={saveEntry}
    className="btn-green"
  >
    ➕ إضافة
  </button>
        <button className="btn-gray">✏️ تعديل</button>
        <button className="btn-red">🗑️ حذف</button>
        <button className="btn-gray">🖨️ طباعة</button>
      </div>

      {/* ================= Filters ================= */}
      <div className="flex justify-between items-center px-2">

  {/* 🔍 البحث — أقصى اليمين */}
  <input
    placeholder="🔍 بحث..."
    className="input w-56 text-right"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  {/* 📅 التاريخ — أقصى اليسار */}
  <div className="flex items-center gap-3">
    <input
      type="date"
      className="input w-40"
      disabled={allDates}
      value={filterDate}
      onChange={(e) => setFilterDate(e.target.value)}
    />

    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={allDates}
        onChange={(e) => setAllDates(e.target.checked)}
      />
      كل التواريخ
    </label>
  </div>

</div>


      {/* ================= Table ================= */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm text-center border border-gray-200">
          <thead className="bg-[#2f4b75] text-white">
            <tr>
              <th className="border px-2 py-1">الرقم</th>
              <th className="border px-2 py-1">التاريخ</th>
              <th className="border px-2 py-1">المبلغ</th>
              <th className="border px-2 py-1">العملة</th>
              <th className="border px-2 py-1">من حساب</th>
              <th className="border px-2 py-1">الى حساب</th>
              <th className="border px-2 py-1">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="py-6 text-gray-400 border">
                لا توجد بيانات
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <datalist id="accountsList">
        {accounts.map(a => (
          <option key={a.id} value={a.name_ar} />
        ))}
      </datalist>

      <style>{`
        .input {
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #ccc;
        }
        .btn-green {
          background: #2f4b75;
          color: #fff;
          padding: 10px 20px;
          border-radius: 10px;
        }
        .btn-gray {
          background: #e5e7eb;
          padding: 10px 20px;
          border-radius: 10px;
        }
        .btn-red {
          background: #dc2626;
          color: #fff;
          padding: 10px 20px;
          border-radius: 10px;
        }
        .notes-box {
          width: 70%;
          height: 120px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #ccc;
          resize: none;
        }
      `}</style>
    </div>
  );
};

export default JournalEntry;

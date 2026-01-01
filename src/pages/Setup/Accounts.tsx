import { useEffect, useState } from "react";
import api from "../../services/api";

/* =========================
   Types
========================= */
type Account = {
  id: number;
  code: string;
  name_ar: string;
  name_en: string | null;
  parent_id: number | null;
  parent_name?: string;
  account_level?: "رئيسي" | "فرعي";
  financial_statement?: string;

  created_at?: string;
  created_by?: string;
  branch_name?: string;
  group_name?: string;

  children?: Account[]; 
};

/* =========================
   Floating Input
========================= */
const FloatingInput = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div className="relative">
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:border-green-600 focus:outline-none"
    />
    <label
      className={`absolute right-3 px-1 bg-[#dfe8e1] transition-all ${
        value ? "-top-2 text-xs text-green-700" : "top-3 text-sm text-gray-500"
      }`}
    >
      {label}
    </label>
  </div>
);

/* =========================
   Floating Select (✔ يدعم disabled)
========================= */
const FloatingSelect = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) => (
  <div className="relative">
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3
                 focus:border-green-600 focus:outline-none
                 disabled:bg-gray-100 disabled:text-gray-500"
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>

    <label className="-top-2 absolute right-3 bg-[#dfe8e1] px-1 text-xs text-green-700">
      {label}
    </label>
  </div>
);

/* =========================
   Tree Node (تمييز رئيسي / فرعي)
========================= */
const TreeNode = ({ node }: { node: Account }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isMain = node.account_level === "رئيسي";

  return (
    <div className="mr-4 mt-2">
      <div
        className={`flex items-center gap-2 cursor-pointer hover:text-green-700
          ${isMain ? "font-bold text-gray-800" : "text-gray-600 italic"}`}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? <span>{open ? "▼" : "▶"}</span> : <span className="w-4" />}
        <span>{isMain ? "📁" : "📄"}</span>
        <span>
          {node.code} - {node.name_ar}
        </span>
        {!isMain && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            فرعي
          </span>
        )}
      </div>

      {hasChildren && open && (
        <div className="border-r border-dashed border-gray-400 mr-4 pr-3">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================
   Main Component
========================= */
const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const [form, setForm] = useState<{
    parent: string;
    costCenter: string;
    group: string;
    name_ar: string;
    name_en: string;
    level: "رئيسي" | "فرعي";
    analysis: string;
    financial: string;
  }>({
    parent: "",
    costCenter: "",
    group: "",
    name_ar: "",
    name_en: "",
    level: "رئيسي",
    analysis: "عام",
    financial: "الميزانية العمومية",
  });

  /* =========================
     Load Accounts
  ========================= */
  const loadAccounts = async () => {
    const data = await api.accounts.getAccounts();
    setAccounts(data.tree);
    setAccountsList(data.list);
  };

  useEffect(() => {
    loadAccounts().finally(() => setLoading(false));
  }, []);

  /* =========================
     جميع الحسابات كآباء
  ========================= */
  const mainAccountsOptions = accountsList.map((a) => ({
    value: String(a.id),
    label: `${a.code} - ${a.name_ar}`,
  }));

  /* =========================
     Row Click → Fill Form
  ========================= */
  const handleRowClick = (row: Account) => {
    setSelectedAccountId(row.id);
    setForm((prev) => ({
      ...prev,
      parent: row.parent_id ? String(row.parent_id) : "",
      name_ar: row.name_ar,
      name_en: row.name_en ?? "",
      level: row.account_level ?? "رئيسي",
    }));
  };

  /* =========================
     Update
  ========================= */
  const handleUpdate = async () => {
    if (!selectedAccountId) {
      alert("اختر حساب من الجدول أولًا");
      return;
    }

    await api.accounts.updateAccount(selectedAccountId, {
      name_ar: form.name_ar,
      name_en: form.name_en,
    });

    await loadAccounts();
  };

  /* =========================
     Add Account
  ========================= */
  const handleAdd = async () => {
    if (!form.name_ar) {
      alert("اسم الحساب مطلوب");
      return;
    }

    await api.accounts.createAccount({
      name_ar: form.name_ar,
      name_en: form.name_en,
      parent_id: form.parent ? Number(form.parent) : null,
      account_level: form.level,
    });

    await loadAccounts();

    setForm({
      parent: "",
      costCenter: "",
      group: "",
      name_ar: "",
      name_en: "",
      level: "رئيسي",
      analysis: "عام",
      financial: "الميزانية العمومية",
    });

    setSelectedAccountId(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-right">دليل الحسابات</h2>

      <div className="grid grid-cols-12 gap-6">
        {/* Tree */}
        <div className="col-span-4 bg-[#dfe8e1] rounded-xl p-4">
          <h3 className="font-bold mb-3 text-right">شجرة الحسابات</h3>
          {loading
            ? "جاري التحميل..."
            : accounts.map((a) => <TreeNode key={a.id} node={a} />)}
        </div>

        {/* Form */}
        <div className="col-span-8 bg-[#dfe8e1] rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <FloatingSelect
              label="حساب الأب"
              value={form.parent}
              onChange={(v) => setForm({ ...form, parent: v })}
              options={mainAccountsOptions}
            />

            <FloatingInput
              label="مركز التكلفة (اختياري)"
              value={form.costCenter}
              onChange={(v) => setForm({ ...form, costCenter: v })}
            />

            <FloatingInput
              label="مجموعة الحسابات"
              value={form.group}
              onChange={(v) => setForm({ ...form, group: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FloatingInput
              label="اسم الحساب"
              value={form.name_ar}
              onChange={(v) => setForm({ ...form, name_ar: v })}
            />
            <FloatingInput
              label="الاسم الأجنبي"
              value={form.name_en}
              onChange={(v) => setForm({ ...form, name_en: v })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FloatingSelect
              label="نوع الحساب"
              value={form.level}
              onChange={(v) =>
                setForm({ ...form, level: v as "رئيسي" | "فرعي" })
              }
              options={[
                { value: "رئيسي", label: "رئيسي" },
                { value: "فرعي", label: "فرعي" },
              ]}
            />

            <FloatingSelect
              label="التحليل"
              value={form.analysis}
              onChange={(v) => setForm({ ...form, analysis: v })}
              options={[
                { value: "عام", label: "عام" },
                { value: "تحليلي", label: "تحليلي" },
              ]}
            />

            <FloatingSelect
              label="القوائم المالية"
              value={form.financial}
              onChange={(v) => setForm({ ...form, financial: v })}
              options={[
                { value: "الميزانية العمومية", label: "الميزانية العمومية" },
                { value: "أرباح وخسائر", label: "أرباح وخسائر" },
              ]}
              disabled
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleUpdate}
              className="rounded-lg bg-green-700 px-5 py-2 text-white"
            >
              تحديث
            </button>
            <button className="rounded-lg bg-gray-300 px-5 py-2">
              مسح الحقول
            </button>
            <button
              onClick={handleAdd}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white"
            >
              إضافة
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-2">الحساب الأب</th>
              <th className="p-2">اسم الحساب</th>
              <th className="p-2">رقم الحساب</th>
              <th className="p-2">الاسم الأجنبي</th>
              <th className="p-2">المستخدم</th>
              <th className="p-2">الفرع</th>
              <th className="p-2">وقت الإدخال</th>
              <th className="p-2">نوع الحساب</th>
              <th className="p-2">مجموعة الحسابات</th>
              <th className="p-2">الحساب الختامي</th>
            </tr>
          </thead>

          <tbody>
            {accountsList.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row)}
                className="cursor-pointer hover:bg-gray-100 border-b"
              >
                <td className="p-2">{row.parent_name ?? "—"}</td>
                <td className="p-2">{row.name_ar}</td>
                <td className="p-2">{row.code}</td>
                <td className="p-2">{row.name_en ?? "—"}</td>
                <td className="p-2">{row.created_by ?? "—"}</td>
                <td className="p-2">{row.branch_name ?? "—"}</td>
                <td className="p-2">{row.created_at}</td>
                <td className="p-2">{row.account_level}</td>
                <td className="p-2">{row.group_name ?? "—"}</td>
                <td className="p-2">{row.financial_statement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Accounts;
 
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { extractList } from "../../utils/apiHelper";

/* =========================
   Types
========================= */
type Account = {
  id: number;
  code: string;
  name_ar: string;
};

type AccountGroup = {
  id: number;
  code: string;
  name_ar: string;
};

type Currency = {
  id: number;
  code: string;
  name_ar: string;
  symbol?: string;
};

type Ceiling = {
  id: number;
  scope: "account" | "group";
  account_id?: number;
  account_group_id?: number;
  account_name?: string;
  group_name?: string;
  currency_id?: number;
  currency_name: string;
  ceiling_amount: number;
  account_type: "debit" | "credit";
  limit_action: "block" | "allow" | "warn";
};

/* =========================
   Component
========================= */
const AccountCeiling: React.FC = () => {
  const [list, setList] = useState<Ceiling[]>([]);
  const [filtered, setFiltered] = useState<Ceiling[]>([]);
  const [search, setSearch] = useState("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    scope: "account" as "account" | "group",
    account_id: "",
    account_group_id: "",
    currency_id: "",
    ceiling_amount: "",
    account_type: "debit" as "debit" | "credit",
    limit_action: "block" as "block" | "allow" | "warn",
  });

  /* =========================
     Load Data
  ========================= */
  const loadAll = async () => {
    try {
      const [c1, c2, c3, c4] = await Promise.all([
        api.get("/account-ceilings"),
        api.get("/accounts"),
        api.get("/account-groups"),
        api.get("/currencies"),
      ]);

      // التسقيف
      const ceilings = extractList<Ceiling>(c1);
      setList(ceilings);
      setFiltered(ceilings);

      // الحسابات
      setAccounts(
        extractList<Account>(c2).map((a) => ({
          id: Number(a.id),
          code: String(a.code),
          name_ar: a.name_ar,
        }))
      );

      // ✅ الحل هنا: قراءة groups أو list
      const rawGroups =
        c3.data?.list || c3.data?.groups || [];

      setGroups(
        rawGroups.map((g: any) => ({
          id: Number(g.id),
          code: String(g.code),
          name_ar: g.name_ar,
        }))
      );

      // العملات
      setCurrencies(
        extractList<Currency>(c4).map((c) => ({
          id: Number(c.id),
          code: c.code,
          name_ar: c.name_ar,
          symbol: c.symbol,
        }))
      );
    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* =========================
     Search
  ========================= */
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      list.filter(
        (x) =>
          x.account_name?.toLowerCase().includes(q) ||
          x.group_name?.toLowerCase().includes(q) ||
          x.currency_name.toLowerCase().includes(q)
      )
    );
  }, [search, list]);

  /* =========================
     Save / Update
  ========================= */
  const save = async () => {
    if (!form.currency_id || !form.ceiling_amount) {
      alert("الرجاء تعبئة الحقول المطلوبة");
      return;
    }

    try {
      if (editId) {
        await api.put(`/account-ceilings/${editId}`, {
          currency_id: Number(form.currency_id),
          ceiling_amount: Number(form.ceiling_amount),
          account_nature: form.account_type,
          exceed_action: form.limit_action,
        });
      } else {
        await api.post("/account-ceilings", {
          scope: form.scope,
          account_id:
            form.scope === "account"
              ? Number(form.account_id)
              : null,
          account_group_id:
            form.scope === "group"
              ? Number(form.account_group_id)
              : null,
          currency_id: Number(form.currency_id),
          ceiling_amount: Number(form.ceiling_amount),
          account_nature: form.account_type,
          exceed_action: form.limit_action,
        });
      }

      setShowModal(false);
      setEditId(null);
      setForm({
        scope: "account",
        account_id: "",
        account_group_id: "",
        currency_id: "",
        ceiling_amount: "",
        account_type: "debit",
        limit_action: "block",
      });

      loadAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || "حدث خطأ");
    }
  };

  /* =========================
     Edit
  ========================= */
  const edit = (c: Ceiling) => {
    setEditId(c.id);
    setForm({
      scope: c.scope,
      account_id: c.account_id ? String(c.account_id) : "",
      account_group_id: c.account_group_id
        ? String(c.account_group_id)
        : "",
      currency_id: currencies.find(
        (x) => x.name_ar === c.currency_name
      )?.id.toString() || "",
      ceiling_amount: String(Math.trunc(c.ceiling_amount)),
      account_type: c.account_type,
      limit_action: c.limit_action,
    });
    setShowModal(true);
  };

  /* =========================
     Delete
  ========================= */
  const remove = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من حذف التسقيف؟")) return;

    try {
      await api.delete(`/account-ceilings/${id}`);
      const newList = list.filter((x) => x.id !== id);
      setList(newList);
      setFiltered(newList);
    } catch (err: any) {
      alert(err?.response?.data?.message || "خطأ أثناء الحذف");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-green-700">
        تسقيف الحسابات
      </h2>

      {/* Search + Add */}
      <div className="flex justify-between items-center">
        <input
          placeholder="🔍 بحث..."
          className="border p-2 rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => {
            setEditId(null);
            setShowModal(true);
          }}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          ➕ إضافة
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm text-center border-collapse">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="border p-2">المجموعة</th>
              <th className="border p-2">الحساب</th>
              <th className="border p-2">العملة</th>
              <th className="border p-2">مبلغ السقف</th>
              <th className="border p-2">طبيعة الحساب</th>
              <th className="border p-2">الإجراء</th>
              <th className="border p-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td className="border p-2">{c.group_name || "-"}</td>
                  <td className="border p-2">{c.account_name || "-"}</td>
                  <td className="border p-2">{c.currency_name}</td>
                  <td className="border p-2">
                    {Math.trunc(c.ceiling_amount)}
                  </td>
                  <td className="border p-2">
                    {c.account_type === "debit" ? "مدين" : "دائن"}
                  </td>
                  <td className="border p-2">
                    {c.limit_action === "block"
                      ? "لا يسمح"
                      : c.limit_action === "warn"
                      ? "يسمح مع تنبيه"
                      : "يسمح"}
                  </td>
                  <td className="border p-2 space-x-2">
                    <button
                      onClick={() => edit(c)}
                      className="text-blue-600"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      className="text-red-600"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-gray-400">
                  لا توجد بيانات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#eef4ee] p-6 rounded w-[520px] space-y-3">
            <h3 className="text-lg font-bold text-center">
              {editId ? "تعديل تسقيف" : "إضافة تسقيف"}
            </h3>
            {/* Scope */}
            <div className="flex gap-6 justify-center">
              <label>
                <input
                  type="radio"
                  checked={form.scope === "account"}
                  onChange={() =>
                    setForm({ ...form, scope: "account" })
                  }
                />{" "}
                حسب الحساب
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.scope === "group"}
                  onChange={() =>
                    setForm({ ...form, scope: "group" })
                  }
                />{" "}
                حسب المجموعة
              </label>
            </div>

            {/* Account / Group */}
            {form.scope === "account" ? (
              <select
                className="border p-2 w-full rounded"
                value={form.account_id}
                onChange={(e) =>
                  setForm({ ...form, account_id: e.target.value })
                }
              >
                <option value="">اسم الحساب</option>
                {accounts.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.code} - {a.name_ar}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="border p-2 w-full rounded"
                value={form.account_group_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    account_group_id: e.target.value,
                  })
                }
              >
                <option value="">مجموعة الحسابات</option>
                {groups.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.code} - {g.name_ar}
                  </option>
                ))}
              </select>
            )}

            {/* Currency */}
            <select
              className="border p-2 w-full rounded"
              value={form.currency_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  currency_id: e.target.value,
                })
              }
            >
              <option value="">العملة</option>
              {currencies.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.code} - {c.name_ar}
                </option>
              ))}
            </select>

            <input
              type="number"
              className="border p-2 w-full rounded"
              placeholder="مبلغ السقف"
              value={form.ceiling_amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  ceiling_amount: e.target.value,
                })
              }
            />

            <select
              className="border p-2 w-full rounded"
              value={form.account_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  account_type: e.target.value as any,
                })
              }
            >
              <option value="debit">مدين</option>
              <option value="credit">دائن</option>
            </select>

            <select
              className="border p-2 w-full rounded"
              value={form.limit_action}
              onChange={(e) =>
                setForm({
                  ...form,
                  limit_action: e.target.value as any,
                })
              }
            >
              <option value="block">لا يسمح</option>
              <option value="allow">يسمح</option>
              <option value="warn">يسمح مع تنبيه</option>
            </select>

            <div className="flex justify-between pt-3">
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

export default AccountCeiling;

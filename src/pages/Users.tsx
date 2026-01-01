import React, { useEffect, useState } from "react";
import api from "../services/api";

interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  permissions?: any;
  status: string;
  image_url?: string;
}

interface Section {
  key: string;
  label: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // بيانات الإدخال
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [role, setRole] = useState("section");

  // 🔥 الصلاحيات (JSON ديناميكي)
  const [permissions, setPermissions] = useState<any>({});

  // جلب المستخدمين
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("❌ خطأ في جلب المستخدمين:", err);
    } finally {
      setLoading(false);
    }
  };

  // جلب الأقسام
 const fetchSections = async () => {
  try {
    // ✅ تأكد أن api.sections موجود
    if (!api.sections || !api.sections.getSections) {
      setSections([]);
      return;
    }

    const data = await api.sections.getSections();
    setSections(data || []);
  } catch (err) {
    console.error("❌ خطأ في جلب الأقسام:", err);
    setSections([]); // ✅ لا تكسر الصفحة
  }
}; 

  useEffect(() => {
    fetchUsers();
    fetchSections();
  }, []);

  // تبديل صلاحيات قسم معين
  const togglePermission = (sectionKey: string, action: string) => {
    setPermissions((prev: any) => {
      const updated = { ...prev };
      if (!updated[sectionKey]) updated[sectionKey] = {};
      updated[sectionKey][action] = !updated[sectionKey][action];
      return updated;
    });
  };
    // فتح مودال التعديل
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.email || user.phone || "");
    setRole(user.role);

    // تحميل صلاحيات المستخدم
    setPermissions(user.permissions || {});

    // إعادة تعيين الحقول
    setPassword("");
    setConfirmPassword("");
    setImage(null);

    setIsModalOpen(true);
  };

  // فتح مودال الإضافة
  const openAddModal = () => {
    setEditingUser(null);
    setName("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setImage(null);
    setRole("section");
    setPermissions({});
    setIsModalOpen(true);
  };

  // حفظ التعديل/الإضافة
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser && password !== confirmPassword) {
      alert("❌ كلمتا المرور غير متطابقتين");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username);

      if (password) formData.append("password", password);
      if (image) formData.append("image", image);

      formData.append("role", role);
      formData.append("permissions", JSON.stringify(permissions));

      if (editingUser) {
        await api.users.updateUser(editingUser.id, formData);
        alert("✔ تم تعديل المستخدم");
      } else {
        await api.users.addUser(formData);
        alert("✔ تم إضافة المستخدم");
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("خطأ:", error);
      alert("❌ حدث خطأ أثناء حفظ البيانات");
    }
  };

  // حذف مستخدم
  const deleteUser = async (id: number) => {
    if (!window.confirm("⚠️ هل تريد حذف المستخدم؟")) return;
    await api.users.deleteUser(id);
    fetchUsers();
  };

  // تعطيل مستخدم
  const disableUser = async (id: number) => {
    if (!window.confirm("⚠️ هل تريد تعطيل المستخدم؟")) return;
    await api.users.disableUser(id);
    fetchUsers();
  };

  // إعادة تعيين كلمة المرور (توليد + نسخ)
  const resetUserPassword = async (id: number) => {
    if (!window.confirm("🔐 هل تريد إنشاء كلمة مرور جديدة؟")) return;

    const res = await api.users.resetPassword(id);

    if (res.success) {
      const pass = res.new_password;

      // نسخ كلمة المرور تلقائيًا
      navigator.clipboard.writeText(pass);

      alert(`🔑 كلمة المرور الجديدة: ${pass}\n📋 تم نسخها تلقائيًا إلى الحافظة`);
    } else {
      alert("❌ حدث خطأ أثناء إعادة التعيين");
    }
  };

  // عرض اسم المستخدم
  const getDisplayName = (user: User) =>
    user.name || user.email || user.phone || "غير محدد";
    return (
    <div className="space-y-6">
      {/* ========= عنوان الصفحة ========== */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>

        <button
          onClick={openAddModal}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          إضافة مستخدم
        </button>
      </div>

      {/* ========= جدول المستخدمين ========== */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-600">جاري التحميل...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-600">لا يوجد مستخدمون</div>
        ) : (
          <table className="w-full text-right">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">الدور</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3 text-center">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {users.map((u, index) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{getDisplayName(u)}</td>
                  <td className="px-4 py-2">
                    {u.role === "admin" ? "أدمن" : "صلاحيات"}
                  </td>
                  <td className="px-4 py-2">
                    {u.status === "active" ? (
                      <span className="text-green-600 font-semibold">نشط</span>
                    ) : (
                      <span className="text-red-600 font-semibold">معطل</span>
                    )}
                  </td>

                  <td className="px-4 py-2 text-center flex justify-center gap-3">
                    <button
                      onClick={() => openEditModal(u)}
                      className="text-blue-600 hover:underline"
                    >
                      تعديل
                    </button>

                    <button
                      onClick={() => resetUserPassword(u.id)}
                      className="text-purple-600 hover:underline"
                    >
                      كلمة مرور جديدة
                    </button>

                    <button
                      onClick={() => disableUser(u.id)}
                      className="text-yellow-600 hover:underline"
                    >
                      تعطيل
                    </button>

                    <button
                      onClick={() => deleteUser(u.id)}
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

      {/* ========= مودال الإضافة والتعديل ========== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-xl max-h-[90vh] overflow-auto">

            <h2 className="text-xl font-bold mb-4">
              {editingUser ? "تعديل مستخدم" : "إضافة مستخدم"}
            </h2>

            <form onSubmit={handleSaveUser} className="space-y-4">

              {/* الاسم */}
              <input
                type="text"
                className="border p-2 rounded w-full"
                placeholder="الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* البريد أو الجوال */}
              <input
                type="text"
                className="border p-2 rounded w-full"
                placeholder="البريد أو رقم الجوال"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              {/* كلمة المرور عند إضافة مستخدم فقط */}
              {!editingUser && (
                <>
                  <input
                    type="password"
                    className="border p-2 rounded w-full"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <input
                    type="password"
                    className="border p-2 rounded w-full"
                    placeholder="تأكيد كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </>
              )}

              {/* صورة المستخدم */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />

              {/* الدور */}
              <select
                className="border p-2 rounded w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">أدمن</option>
                <option value="section">صلاحيات محددة</option>
              </select>

              {/* ========= الصلاحيات الديناميكية ========== */}
              {role === "section" && (
                <div className="border rounded p-3 space-y-4">
                  <h3 className="font-bold mb-2">صلاحيات المستخدم</h3>

                  {sections.map((sec) => (
                    <div key={sec.key} className="border rounded p-2">

                      <h4 className="font-semibold mb-2">{sec.label}</h4>

                      <div className="flex flex-wrap gap-4">

                        <label>
                          <input
                            type="checkbox"
                            checked={permissions[sec.key]?.view || false}
                            onChange={() => togglePermission(sec.key, "view")}
                          /> عرض
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={permissions[sec.key]?.add || false}
                            onChange={() => togglePermission(sec.key, "add")}
                          /> إضافة
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={permissions[sec.key]?.edit || false}
                            onChange={() => togglePermission(sec.key, "edit")}
                          /> تعديل
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={permissions[sec.key]?.delete || false}
                            onChange={() => togglePermission(sec.key, "delete")}
                          /> حذف
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={permissions[sec.key]?.print || false}
                            onChange={() => togglePermission(sec.key, "print")}
                          /> طباعة
                        </label>

                      </div>
                    </div>
                  ))}

                </div>
              )}

              {/* الأزرار */}
              <div className="flex justify-end gap-2 mt-4">

                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  حفظ
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  إلغاء
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
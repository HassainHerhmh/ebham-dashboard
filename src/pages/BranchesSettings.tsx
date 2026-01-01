import React, { useState, useEffect } from "react";

interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  created_at?: string;
}

const BranchesSettings: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // جلب الفروع من السيرفر
  const fetchBranches = () => {
    fetch("http://localhost:5000/branches") // عدل الرابط حسب الإعداد
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBranches(data.branches);
        }
      })
      .catch((err) => console.error("خطأ في جلب الفروع:", err));
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // فتح مودال الإضافة أو التعديل
  const openAddModal = () => {
    setEditMode(false);
    setSelectedBranchId(null);
    setName("");
    setAddress("");
    setPhone("");
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditMode(true);
    setSelectedBranchId(branch.id);
    setName(branch.name);
    setAddress(branch.address || "");
    setPhone(branch.phone || "");
    setIsModalOpen(true);
  };

  // حفظ البيانات
  const handleSave = () => {
    if (!name.trim()) {
      alert("❌ يرجى إدخال اسم الفرع");
      return;
    }

    const branchData = { name, address, phone };
    const url = editMode
      ? `http://localhost:5000/branches/${selectedBranchId}`
      : `http://localhost:5000/branches`;
    const method = editMode ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branchData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert(data.message);
          fetchBranches();
          setIsModalOpen(false);
        } else {
          alert(data.message);
        }
      })
      .catch((err) => console.error("خطأ:", err));
  };

  // حذف فرع
  const handleDelete = (id: number) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    fetch(`http://localhost:5000/branches/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert(data.message);
          fetchBranches();
        } else {
          alert(data.message);
        }
      })
      .catch((err) => console.error("خطأ في الحذف:", err));
  };

  return (
    <div className="p-4" style={{ direction: "rtl" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">📍 إدارة الفروع</h2>
        <button
          onClick={openAddModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          ➕ إضافة فرع
        </button>
      </div>

      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">الاسم</th>
            <th className="border p-2">العنوان</th>
            <th className="border p-2">الهاتف</th>
            <th className="border p-2">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch) => (
            <tr key={branch.id}>
              <td className="border p-2">{branch.name}</td>
              <td className="border p-2">{branch.address || "-"}</td>
              <td className="border p-2">{branch.phone || "-"}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => openEditModal(branch)}
                  className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* مودال إضافة/تعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">
              {editMode ? "✏️ تعديل الفرع" : "➕ إضافة فرع جديد"}
            </h3>
            <input
              type="text"
              placeholder="اسم الفرع"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 p-2 w-full mb-3"
            />
            <input
              type="text"
              placeholder="العنوان"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border border-gray-300 p-2 w-full mb-3"
            />
            <input
              type="text"
              placeholder="الهاتف"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-gray-300 p-2 w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

export default BranchesSettings;
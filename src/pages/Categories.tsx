import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { PlusCircle, Edit3, Trash2, X } from "lucide-react";

interface Category {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
  image_url?: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  // إضافة
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // تعديل
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);

  // حالات
  const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("icon_url", iconUrl);
    if (image) formData.append("image", image);

    const res = await fetch("http://localhost:5000/categories", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("✅ تمت إضافة الفئة بنجاح!");
      setName("");
      setDescription("");
      setIconUrl("");
      setImage(null);
      setIsAddSidebarOpen(false);
      fetchCategories();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    const res = await fetch(`http://localhost:5000/categories/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      alert("🗑 تم حذف الفئة");
      fetchCategories();
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const formData = new FormData();
    formData.append("name", editName);
    formData.append("description", editDescription);
    formData.append("icon_url", editIcon);
    if (editImage) formData.append("image", editImage);

    const res = await fetch(`http://localhost:5000/categories/${editId}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      alert("✏ تم تعديل الفئة");
      setEditId(null);
      setEditName("");
      setEditDescription("");
      setEditIcon("");
      setEditImage(null);
      setIsEditSidebarOpen(false);
      fetchCategories();
    }
  };

  return (
    <div className="p-6 relative" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📂 قائمة الفئات</h2>
        <button
          onClick={() => setIsAddSidebarOpen(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          <PlusCircle size={20} />
          إضافة فئة
        </button>
      </div>

      {/* جدول الفئات */}
      <table className="table-auto w-full border-collapse border border-gray-300 text-right">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">الاسم</th>
            <th className="border p-2">الوصف</th>
            <th className="border p-2">الأيقونة</th>
            <th className="border p-2">الصورة</th>
            <th className="border p-2">خيارات</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, i) => (
            <tr key={cat.id}>
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">{cat.name}</td>
              <td className="border p-2">{cat.description || "-"}</td>
              <td className="border p-2">
                {cat.icon_url ? (
                  <img src={cat.icon_url} alt="Icon" className="w-8 h-8" />
                ) : (
                  "-"
                )}
              </td>
              <td className="border p-2 text-center">
                {cat.image_url ? (
                  <img
                    src={`http://localhost:5000${cat.image_url}`}
                    alt={cat.name}
                    width={60}
                    height={60}
                    className="object-cover rounded"
                  />
                ) : (
                  "بدون صورة"
                )}
              </td>
              <td className="border p-2 text-center flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setEditId(cat.id);
                    setEditName(cat.name);
                    setEditDescription(cat.description || "");
                    setEditIcon(cat.icon_url || "");
                    setIsEditSidebarOpen(true);
                  }}
                  className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                >
                  <Edit3 size={16} /> تعديل
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  <Trash2 size={16} /> حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* شريط جانبي للإضافة */}
      {isAddSidebarOpen && (
        <SidebarForm
          title="➕ إضافة فئة جديدة"
          onClose={() => setIsAddSidebarOpen(false)}
          onSubmit={handleAdd}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          iconUrl={iconUrl}
          setIconUrl={setIconUrl}
          image={image}
          setImage={setImage}
        />
      )}

      {/* شريط جانبي للتعديل */}
      {isEditSidebarOpen && (
        <SidebarForm
          title="✏ تعديل الفئة"
          onClose={() => setIsEditSidebarOpen(false)}
          onSubmit={handleUpdate}
          name={editName}
          setName={setEditName}
          description={editDescription}
          setDescription={setEditDescription}
          iconUrl={editIcon}
          setIconUrl={setEditIcon}
          image={editImage}
          setImage={setEditImage}
        />
      )}
    </div>
  );
};

// 📄 مكون الشريط الجانبي
interface SidebarProps {
  title: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  iconUrl: string;
  setIconUrl: (val: string) => void;
  image: File | null;
  setImage: (val: File | null) => void;
}

const SidebarForm: React.FC<SidebarProps> = ({
  title,
  onClose,
  onSubmit,
  name,
  setName,
  description,
  setDescription,
  iconUrl,
  setIconUrl,
  setImage,
}) => {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-lg transform translate-x-0 transition-transform duration-300 z-50">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="اسم الفئة"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded w-full"
              required
            />
            <textarea
              placeholder="وصف الفئة"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border p-2 rounded w-full"
              rows={3}
            ></textarea>
            <input
              type="text"
              placeholder="رابط الأيقونة"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <input
              type="file"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setImage(e.target.files ? e.target.files[0] : null)
              }
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700"
            >
              حفظ
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Categories;

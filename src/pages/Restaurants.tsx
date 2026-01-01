import React, { useState, useEffect } from "react";
import { Store, Plus, X, Trash2, Edit3 } from "lucide-react";
import axios from "axios";

interface Restaurant {
  id: number;
  name: string;
  address: string;
  phone: string;
  image_url: string;
  type_name?: string;
  type_id?: number;
  categories?: string;
  category_ids?: string;
  delivery_time?: string;
  pricing_plan?: string;
  created_at: string;
  schedule?: ScheduleItem[];
}

interface Category {
  id: number;
  name: string;
}

interface Type {
  id: number;
  name: string;
}

interface ScheduleItem {
  day: string;
  start?: string;
  end?: string;
  start_time?: string;
  end_time?: string;
  closed: boolean;
}

const API_URL = "http://localhost:5000";
const daysOfWeek = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

const Restaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [storeSchedule, setStoreSchedule] = useState<ScheduleItem[]>(
    daysOfWeek.map((day) => ({ day, start: "", end: "", closed: false }))
  );

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(
    null
  );

  // مودال التوقيت
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleItem[]>([]);
  const [currentRestaurantName, setCurrentRestaurantName] = useState("");

  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    address: "",
    phone: "",
    image_url: "",
    delivery_time: "",
    pricing_plan: "",
  });

  // 🔹 جلب البيانات
  const fetchRestaurants = async () => {
    const res = await axios.get(`${API_URL}/restaurants`);
    setRestaurants(res.data.restaurants || res.data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const res = await axios.get(`${API_URL}/categories`);
    setCategories(res.data);
  };

  const fetchTypes = async () => {
    const res = await axios.get(`${API_URL}/types`);
    setTypes(res.data.types || res.data);
  };

  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
    fetchTypes();
  }, []);

  // 🔹 اختيار فئة
  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // 🔹 صورة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const img = e.target.files?.[0];
    if (img) {
      setFile(img);
      setPreview(URL.createObjectURL(img));
    }
  };

  // 🔹 حفظ (إضافة / تعديل)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    if (selectedType) data.append("type_id", String(selectedType));
    data.append("address", formData.address);
    data.append("phone", formData.phone);
    data.append("delivery_time", formData.delivery_time);
    data.append("pricing_plan", formData.pricing_plan);
    data.append("category_ids", JSON.stringify(selectedCategories));
    data.append("schedule", JSON.stringify(storeSchedule));
    if (file) data.append("image_url", file);

    if (editMode) {
      await axios.put(`${API_URL}/restaurants/${formData.id}`, data);
      alert("✅ تم تعديل المطعم");
    } else {
      await axios.post(`${API_URL}/restaurants`, data);
      alert("✅ تم إضافة المطعم");
    }
    resetForm();
    fetchRestaurants();
  };

  // 🔹 تعديل
  const handleEdit = (r: Restaurant) => {
    setFormData({
      id: r.id,
      name: r.name,
      address: r.address,
      phone: r.phone,
      image_url: r.image_url || "",
      delivery_time: r.delivery_time || "",
      pricing_plan: r.pricing_plan || "",
    });

    const categoryIds = r.category_ids
      ? String(r.category_ids)
          .split(",")
          .map((id) => Number(id))
      : [];

    setSelectedCategories(categoryIds);
    setSelectedType(r.type_id || null);
    setPreview(r.image_url ? `${API_URL}${r.image_url}` : null);
    setStoreSchedule(
      r.schedule
        ? r.schedule.map((s) => ({
            day: s.day,
            start: s.start_time || s.start || "",
            end: s.end_time || s.end || "",
            closed: s.closed,
          }))
        : daysOfWeek.map((day) => ({ day, start: "", end: "", closed: false }))
    );
    setEditMode(true);
    setShowModal(true);
  };

  // 🔹 حذف
  const handleDelete = async (id: number) => {
    if (!window.confirm("تأكيد حذف المطعم؟")) return;
    await axios.delete(`${API_URL}/restaurants/${id}`);
    fetchRestaurants();
  };

  // 🔹 إعادة تعيين
  const resetForm = () => {
    setFormData({
      id: 0,
      name: "",
      address: "",
      phone: "",
      image_url: "",
      delivery_time: "",
      pricing_plan: "",
    });
    setSelectedCategories([]);
    setSelectedType(null);
    setStoreSchedule(daysOfWeek.map((day) => ({ day, start: "", end: "", closed: false })));
    setFile(null);
    setPreview(null);
    setEditMode(false);
    setShowModal(false);
  };

  // 🔹 عرض مودال التوقيت
  const showSchedule = (schedule: any[], name: string, id: number) => {
    setCurrentRestaurantName(name);
    setCurrentSchedule(
      schedule && schedule.length > 0
        ? schedule.map((s) => ({
            day: s.day,
            start_time: s.start_time || s.start,
            end_time: s.end_time || s.end,
            closed: s.closed,
          }))
        : daysOfWeek.map((d) => ({ day: d, start_time: "", end_time: "", closed: false }))
    );
    setSelectedRestaurantId(id);
    setShowScheduleModal(true);
  };

  // 🔹 حفظ جدول التوقيت المعدل
  const saveSchedule = async () => {
    try {
      await axios.put(`${API_URL}/restaurants/schedule/update`, {
        restaurant_id: selectedRestaurantId,
        schedule: currentSchedule,
      });
      alert("✅ تم حفظ التغييرات بنجاح");
      setShowScheduleModal(false);
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      alert("❌ حدث خطأ أثناء الحفظ");
    }
  };

  // 🔹 واجهة العرض
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="w-7 h-7" /> المطاعم / المحلات
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> إضافة جديد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">⏳ جاري التحميل...</div>
        ) : (
          <table className="w-full text-center">
            <thead className="bg-gray-50">
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>العنوان</th>
                <th>الهاتف</th>
                <th>وقت التوصيل</th>
                <th>خطة التسعيرة</th>
                <th>الفئات</th>
                <th>الصورة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r, index) => (
                <tr key={r.id}>
                  <td>#{index + 1}</td>
                  <td>{r.name}</td>
                  <td>{r.type_name || "-"}</td>
                  <td>{r.address}</td>
                  <td>{r.phone}</td>
                  <td>{r.delivery_time || "-"}</td>
                  <td>{r.pricing_plan || "-"}</td>
                  <td>{r.categories || "-"}</td>
                  <td>
                    {r.image_url && (
                      <img
                        src={`${API_URL}${r.image_url}`}
                        alt={r.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(r)}
                      className="text-blue-600"
                    >
                      <Edit3 />
                    </button>
                    <button
                      onClick={() =>
                        showSchedule(r.schedule || [], r.name, r.id)
                      }
                      className="text-green-600"
                    >
                      📅
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-600"
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🟦 مودال الإضافة / التعديل */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg overflow-y-auto max-h-screen">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editMode ? "تعديل" : "إضافة"}
              </h2>
              <button onClick={resetForm}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="اسم المطعم"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="border rounded-lg px-3 py-2 w-full"
              />

              <select
                value={selectedType || ""}
                onChange={(e) => setSelectedType(Number(e.target.value))}
                className="border rounded-lg px-3 py-2 w-full"
                required
              >
                <option value="">اختر النوع</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="العنوان"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="border rounded-lg px-3 py-2 w-full"
              />

              <input
                type="text"
                placeholder="الهاتف"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="border rounded-lg px-3 py-2 w-full"
              />

              <input
                type="text"
                placeholder="وقت التوصيل مثال: 30-60 دقيقة"
                value={formData.delivery_time}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_time: e.target.value })
                }
                className="border rounded-lg px-3 py-2 w-full"
              />

              <input
                type="text"
                placeholder="خطة التسعيرة"
                value={formData.pricing_plan}
                onChange={(e) =>
                  setFormData({ ...formData, pricing_plan: e.target.value })
                }
                className="border rounded-lg px-3 py-2 w-full"
              />

              <div className="border p-2 rounded-lg max-h-32 overflow-y-auto">
                {categories.map((c) => (
                  <label key={c.id} className="block">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(c.id)}
                      onChange={() => toggleCategory(c.id)}
                      className="mr-2"
                    />
                    {c.name}
                  </label>
                ))}
              </div>

              {/* التوقيت */}
              <div className="border p-3 rounded-lg">
                <h3 className="font-semibold mb-2">🕐 جدول التوقيت</h3>
                {storeSchedule.map((dayItem, index) => (
                  <div key={dayItem.day} className="flex items-center gap-2 mb-2">
                    <label className="w-20">{dayItem.day}</label>
                    {dayItem.closed ? (
                      <span className="text-red-600 font-medium">مغلق</span>
                    ) : (
                      <>
                        <input
                          type="time"
                          value={dayItem.start}
                          onChange={(e) => {
                            const copy = [...storeSchedule];
                            copy[index].start = e.target.value;
                            setStoreSchedule(copy);
                          }}
                          className="border px-2 py-1 rounded"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={dayItem.end}
                          onChange={(e) => {
                            const copy = [...storeSchedule];
                            copy[index].end = e.target.value;
                            setStoreSchedule(copy);
                          }}
                          className="border px-2 py-1 rounded"
                        />
                      </>
                    )}
                    <label>
                      <input
                        type="checkbox"
                        checked={dayItem.closed}
                        onChange={(e) => {
                          const copy = [...storeSchedule];
                          copy[index].closed = e.target.checked;
                          if (e.target.checked) {
                            copy[index].start = "";
                            copy[index].end = "";
                          }
                          setStoreSchedule(copy);
                        }}
                      />{" "}
                      مغلق
                    </label>
                  </div>
                ))}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
              {preview && (
                <img src={preview} alt="معاينة" className="w-16 h-16 rounded" />
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟩 مودال التوقيت */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">
                🕒 تعديل جدول التوقيت – {currentRestaurantName}
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-600 hover:text-black"
              >
                ✖
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {currentSchedule.map((s, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <span className="font-medium w-20">{s.day}</span>
                  <div className="flex items-center gap-2">
                    {s.closed ? (
                      <span className="text-red-600 text-sm font-semibold">
                        مغلق
                      </span>
                    ) : (
                      <>
                        <input
                          type="time"
                          value={s.start_time || s.start || ""}
                          onChange={(e) => {
                            const copy = [...currentSchedule];
                            copy[index].start_time = e.target.value;
                            setCurrentSchedule(copy);
                          }}
                          className="border rounded px-1 text-sm w-24"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={s.end_time || s.end || ""}
                          onChange={(e) => {
                            const copy = [...currentSchedule];
                            copy[index].end_time = e.target.value;
                            setCurrentSchedule(copy);
                          }}
                          className="border rounded px-1 text-sm w-24"
                        />
                      </>
                    )}
                    <input
                      type="checkbox"
                      checked={s.closed}
                      onChange={(e) => {
                        const copy = [...currentSchedule];
                        copy[index].closed = e.target.checked;
                        if (e.target.checked) {
                          copy[index].start_time = "";
                          copy[index].end_time = "";
                        }
                        setCurrentSchedule(copy);
                      }}
                    />
                    <span className="text-xs">مغلق</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                إغلاق
              </button>
              <button
                onClick={saveSchedule}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                💾 حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restaurants;
import React, { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

interface City {
  id: number;
  name: string;
  delivery_fee: number;
  neighborhoods: { id: number; name: string }[];
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  created_at?: string;
}

interface Address {
  id: number;
  customer_id: number;
  customer_name: string;
  province: number;
  district: number;
  location_type?: string;
  address?: string;
  gps_link?: string;
  latitude?: string;
  longitude?: string;
}

const API_URL = "http://localhost:5000";

const Customers: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchAddress, setSearchAddress] = useState("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);

  // Add Customer Fields
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Edit Fields
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Address Fields
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [locationType, setLocationType] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [gpsLink, setGpsLink] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [editAddress, setEditAddress] = useState<Address | null>(null);

  // Maps
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isEditMapOpen, setIsEditMapOpen] = useState(false);

  const mapAddRef = useRef<HTMLDivElement | null>(null);
  const mapEditRef = useRef<HTMLDivElement | null>(null);

  // Load Google Maps Script
  useEffect(() => {
    if (window.google) return;
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_API_KEY&libraries=places";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Fetch Data
  const fetchCities = async () => {
    const res = await fetch(`${API_URL}/cities`);
    const data = await res.json();
    if (data.success) setCities(data.cities);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/customers`);
    const data = await res.json();
    if (data.success) setCustomers(data.customers);
    setLoading(false);
  };

  const fetchAddresses = async () => {
    const res = await fetch(`${API_URL}/customer-addresses`);
    const data = await res.json();
    if (data.success) setAddresses(data.addresses);
  };

  useEffect(() => {
    fetchCities();
    fetchCustomers();
  }, []);

  /* ================= ADD CUSTOMER ================= */
  const handleAddCustomer = async () => {
    if (!newName || !newPhone || !newPassword)
      return alert("❌ جميع الحقول مطلوبة");

    if (newPassword !== confirmPassword)
      return alert("❌ كلمة المرور غير متطابقة");

    const res = await fetch(`${API_URL}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        phone: newPhone,
        email: newEmail,
        password: newPassword,
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert("✔ تم إضافة العميل");

      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");

      setIsAddOpen(false);
      fetchCustomers();
    }
  };

  /* ================= EDIT CUSTOMER ================= */
  const handleEditCustomer = async () => {
    if (!editCustomer) return;

    await fetch(`${API_URL}/customers/${editCustomer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        phone: editPhone,
        email: editEmail,
      }),
    });

    setIsEditOpen(false);
    fetchCustomers();
  };

  /* ================= RESET PASSWORD ================= */
  const handleResetPassword = async (id: number) => {
    const res = await fetch(`${API_URL}/customers/${id}/reset-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.success) {
      const pass = data.new_password;

      navigator.clipboard.writeText(pass);

      alert(`🔑 كلمة المرور الجديدة: ${pass}\n📋 تم نسخها تلقائيًا`);
    }
  };

  /* ================= DELETE CUSTOMER ================= */
  const deleteCustomer = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;

    await fetch(`${API_URL}/customers/${id}`, { method: "DELETE" });
    fetchCustomers();
  };

  /* ================= FILTER ================= */
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      c.phone.includes(searchCustomer)
  );

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold">📋 العملاء</h1>

      <div className="flex justify-between">
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          ➕ إضافة عميل
        </button>

        <button
          onClick={() => {
            fetchAddresses();
            setIsAddressesOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          📍 إدارة العناوين
        </button>
      </div>

      <input
        className="border p-2 rounded w-full"
        placeholder="🔍 بحث عن عميل"
        value={searchCustomer}
        onChange={(e) => setSearchCustomer(e.target.value)}
      />

      {/* Customers Table */}
      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-center">
          <thead className="bg-gray-100">
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>الجوال</th>
              <th>البريد</th>
              <th>التاريخ</th>
              <th>إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.email || "-"}</td>
                <td>{c.created_at?.slice(0, 10)}</td>

                <td className="flex gap-2 justify-center py-2">
                  <button
                    onClick={() => {
                      setEditCustomer(c);
                      setEditName(c.name);
                      setEditPhone(c.phone);
                      setEditEmail(c.email || "");
                      setIsEditOpen(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    تعديل
                  </button>

                  <button
                    onClick={() => handleResetPassword(c.id)}
                    className="bg-purple-600 text-white px-3 py-1 rounded"
                  >
                    كلمة مرور جديدة
                  </button>

                  <button
                    onClick={() => deleteCustomer(c.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md space-y-4">

            <h2 className="text-xl font-bold">➕ إضافة عميل</h2>

            <input
              className="border p-2 rounded w-full"
              placeholder="الاسم"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="الجوال"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="البريد الإلكتروني"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />

            <input
              className="border p-2 rounded w-full"
              type="password"
              placeholder="كلمة المرور"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              className="border p-2 rounded w-full"
              type="password"
              placeholder="تأكيد كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              onClick={handleAddCustomer}
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
            >
              حفظ
            </button>

            <button
              onClick={() => setIsAddOpen(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded w-full"
            >
              إغلاق
            </button>

          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditOpen && editCustomer && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md space-y-4">

            <h2 className="text-xl font-bold">✏️ تعديل عميل</h2>

            <input
              className="border p-2 rounded w-full"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <input
              className="border p-2 rounded w-full"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />

            <input
              className="border p-2 rounded w-full"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />

            <button
              onClick={handleEditCustomer}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              حفظ التعديل
            </button>

            <button
              onClick={() => setIsEditOpen(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded w-full"
            >
              إغلاق
            </button>

          </div>
        </div> 
      )}
      
      {/* إدارة العناوين */}
      {isAddressesOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-4xl h-[90vh] overflow-auto">

            <h2 className="text-xl font-bold mb-3">📍 إدارة العناوين</h2>

            <input
              className="border p-2 rounded w-full mb-3"
              placeholder="🔍 بحث في العناوين"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
            />

            {/* إضافة عنوان */}
            <form onSubmit={async(e)=>{
              e.preventDefault();
              if (!selectedCustomer || !province || !district)
                return alert("❌ البيانات مطلوبة");

              const res = await fetch(`${API_URL}/customer-addresses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customer_id: selectedCustomer,
                  province,
                  district,
                  location_type: locationType,
                  address: detailAddress,
                  gps_link: gpsLink,
                  latitude,
                  longitude
                })
              });

              const data = await res.json();
              if (data.success) {
                alert("✔ تم إضافة العنوان");
                fetchAddresses();
              }
            }} className="space-y-3">

              <select className="border p-2 rounded w-full"
                value={selectedCustomer}
                onChange={(e)=>setSelectedCustomer(e.target.value)}>
                <option value="">اختر عميل</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select className="border p-2 rounded w-full"
                value={province}
                onChange={(e)=>{
                  setProvince(e.target.value);
                  setDistrict("");
                }}>
                <option value="">اختر المدينة</option>
                {cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select className="border p-2 rounded w-full"
                value={district}
                onChange={(e)=>setDistrict(e.target.value)}>
                <option value="">اختر الحي</option>
                {cities.find(c=>String(c.id)===province)?.neighborhoods.map(n=>
                  <option key={n.id} value={n.id}>{n.name}</option>
                )}
              </select>

              <select className="border p-2 rounded w-full"
                value={locationType}
                onChange={(e)=>setLocationType(e.target.value)}>
                <option value="">نوع الموقع</option>
                <option value="منزل">منزل</option>
                <option value="شقة">شقة</option>
                <option value="عمل">عمل</option>
                <option value="مستودع">مستودع</option>
                <option value="فيلا">فيلا</option>
              </select>

              <input className="border p-2 rounded w-full"
                placeholder="العنوان التفصيلي"
                value={detailAddress}
                onChange={(e)=>setDetailAddress(e.target.value)} />

              <input className="border p-2 rounded w-full"
                placeholder="GPS Link"
                value={gpsLink}
                onChange={(e)=>setGpsLink(e.target.value)} />

              <div className="flex gap-2">
                <input className="border p-2 rounded w-full"
                placeholder="Latitude"
                value={latitude}
                onChange={(e)=>setLatitude(e.target.value)} />

                <input className="border p-2 rounded w-full"
                placeholder="Longitude"
                value={longitude}
                onChange={(e)=>setLongitude(e.target.value)} />
              </div>

              <button type="button"
                onClick={()=>setIsMapOpen(true)}
                className="bg-blue-600 text-white p-2 rounded w-full">
                🗺 اختيار الموقع من الخريطة
              </button>

              <button type="submit"
                className="bg-green-600 text-white p-2 rounded w-full">
                حفظ العنوان
              </button>

            </form>

            {/* جدول العناوين */}
            <table className="w-full mt-4 text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th>العميل</th>
                  <th>المدينة</th>
                  <th>الحي</th>
                  <th>نوع</th>
                  <th>العنوان</th>
                  <th>GPS</th>
                  <th>إحداثيات</th>
                  <th>تعديل</th>
                  <th>حذف</th>
                </tr>
              </thead>

              <tbody>
                {addresses.map(a=>(
                  <tr key={a.id} className="border-t">
                    <td>{a.customer_name}</td>
                    <td>{cities.find(c=>c.id===a.province)?.name}</td>
                    <td>{cities.flatMap(c=>c.neighborhoods).find(n=>n.id===a.district)?.name}</td>
                    <td>{a.location_type}</td>
                    <td>{a.address}</td>
                    <td>{a.gps_link ? <a href={a.gps_link} className="text-blue-600">رابط</a> : "-"}</td>
                    <td>{a.latitude}, {a.longitude}</td>

                    <td>
                      <button
                        onClick={()=>setEditAddress(a)}
                        className="bg-blue-600 text-white px-2 py-1 rounded">
                        ✏️
                      </button>
                    </td>

                    <td>
                      <button
                        onClick={async()=>{
                          if(!window.confirm("❌ حذف العنوان؟")) return;
                          await fetch(`${API_URL}/customer-addresses/${a.id}`, {method:"DELETE"});
                          fetchAddresses();
                        }}
                        className="bg-red-600 text-white px-2 py-1 rounded">
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

            <button
              onClick={()=>setIsAddressesOpen(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded w-full mt-4">
              إغلاق
            </button>

          </div>
        </div>
      )}

      {/* خرائط الإضافة */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-2xl h-[500px] rounded shadow relative">
            <div ref={mapAddRef} className="w-full h-full"></div>

            <button
              onClick={()=>setIsMapOpen(false)}
              className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded">
              ✖
            </button>
          </div>
        </div>
      )}

      {/* خرائط التعديل */}
      {isEditMapOpen && editAddress && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-2xl h-[500px] rounded shadow relative">
            <div ref={mapEditRef} className="w-full h-full"></div>

            <button
              onClick={()=>setIsEditMapOpen(false)}
              className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded">
              ✖
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
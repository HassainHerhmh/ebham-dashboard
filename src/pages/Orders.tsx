import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import api from "../services/api";

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  restaurant_name: string;
  restaurant_phone: string;
  captain_name?: string;
  status: string;
  total_amount?: number | string | null;
  delivery_fee?: number | string | null;
  created_at: string;
}

interface Captain {
  id: number;
  name: string;
  pending_orders: number;
  completed_today: number;
}

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
  notes?: string;
  category_id?: number;
}

interface OrderDetails {
  id: number;
  products: Product[];
  restaurant_name: string;
  restaurant_phone: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  latitude: string;
  longitude: string;
  delivery_fee: number | string | null;
}

const Orders: React.FC = () => {
  // ========= الطلبات =========
  const [orders, setOrders] = useState<Order[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [loading, setLoading] = useState(true);
  const [captainsLoading, setCaptainsLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isCaptainModalOpen, setIsCaptainModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetails | null>(null);

  // ========= إضافة طلب جديد =========
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [gpsLink, setGpsLink] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);

  // المنتجات داخل إضافة الطلب
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [restaurantCategories, setRestaurantCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  const printRef = useRef<HTMLDivElement>(null);

  // ====================================
  //          الجلب والاستدعاءات
  // ====================================
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.orders.getOrders({ limit: 50 });
      setOrders(res.orders || res);
    } catch (error) {
      console.error("❌ خطأ في جلب الطلبات:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaptains = async () => {
    setCaptainsLoading(true);
    try {
      const res = await api.captains.getAvailableCaptains();
      setCaptains(res.captains || res);
    } catch (error) {
      console.error("❌ خطأ في جلب الكباتن:", error);
    } finally {
      setCaptainsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    api.get("/customers").then((res) => setCustomers(res.data.customers));
    api.get("/restaurants").then((res) => setRestaurants(res.data.restaurants));
  }, []);

  // ====================================
  //      إدارة الطلبات الحالية
  // ====================================
  const openCaptainModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsCaptainModalOpen(true);
    fetchCaptains();
  };

  const assignCaptain = async (captainId: number) => {
    if (!selectedOrderId) return;
    try {
      await api.orders.assignCaptain(selectedOrderId, captainId);
      alert("✅ تم تعيين الكابتن بنجاح");
      setIsCaptainModalOpen(false);
      setSelectedOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error("❌ خطأ في إسناد الكابتن:", error);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.orders.updateStatus(orderId, newStatus);
      alert("✅ تم تحديث حالة الطلب");
      fetchOrders();
    } catch (error) {
      console.error("❌ خطأ في تحديث الحالة:", error);
    }
  };

  const openDetailsModal = async (orderId: number) => {
    try {
      const res = await api.orders.getOrderDetails(orderId);
      setSelectedOrderDetails(res.order || res);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error("❌ خطأ في جلب تفاصيل الطلب:", error);
    }
  };

  const handlePrint = () => {
    if (!printRef.current || !selectedOrderDetails) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (win) {
      const htmlContent = `
        <html>
          <head>
            <title>فاتورة الطلب</title>
            <style>
              body { font-family: sans-serif; padding: 20px; direction: rtl; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #999; padding: 6px; text-align: center; }
              th { background: #eee; }
              .box { border:1px solid #ccc; padding:8px; margin-top:10px; border-radius:8px; }
            </style>
          </head>
          <body>
            <h2 style="text-align:center;">🧾 فاتورة الطلب #${selectedOrderDetails.id}</h2>
            ${printRef.current.innerHTML}
            <div class="box">
              <h3>🏪 المطعم</h3>
              <p>الاسم: ${selectedOrderDetails.restaurant_name}</p>
              <p>الهاتف: ${selectedOrderDetails.restaurant_phone}</p>
            </div>
            <div class="box">
              <h3>👤 العميل</h3>
              <p>الاسم: ${selectedOrderDetails.customer_name}</p>
              <p>الهاتف: ${selectedOrderDetails.customer_phone}</p>
              <p>العنوان: ${selectedOrderDetails.customer_address}</p>
              <p>الإحداثيات: ${selectedOrderDetails.latitude}, ${selectedOrderDetails.longitude}</p>
            </div>
          </body>
        </html>
      `;
      win.document.write(htmlContent);
      win.document.close();
      win.print();
    }
  };

  const formatAmount = (amount: any): string => {
    const num = Number(amount);
    return isNaN(num) ? "-" : num.toFixed(2) + " ريال";
  };

  // ====================================
  //          إضافة طلب جديد
  // ====================================
  const selectCustomer = async (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer);
    setAddresses([]);
    if (customer) {
      const res = await api.get(`/customer-addresses?customer_id=${customer.id}`);
      setAddresses(res.data.addresses);
    }
  };

  const selectRestaurant = async (restaurantId: number) => {
    const rest = restaurants.find((r) => r.id === restaurantId);
    setSelectedRestaurant(rest);
    const catRes = await api.get(`/restaurants/${restaurantId}/categories`);
    setRestaurantCategories(catRes.data.categories);
    setSelectedCategory(catRes.data.categories[0]?.id || null);
  };

  const openProductsModal = async () => {
    if (!selectedRestaurant) return alert("اختر مطعم أولا");
    const prodRes = await api.get(`/restaurants/${selectedRestaurant.id}/products`);
    setProducts(prodRes.data.products);
    setShowProductsModal(true);
  };

  const addToCart = (product: any) => {
    const exists = cart.find((p) => p.id === product.id);
    if (exists) {
      setCart(cart.map((p) => (p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const saveOrder = async () => {
    if (!selectedCustomer || !selectedAddress || !selectedRestaurant || cart.length === 0) {
      return alert("اكمل البيانات المطلوبة");
    }
    const payload = {
      customer_id: selectedCustomer.id,
      address_id: selectedAddress.id,
      gps_link: gpsLink,
      restaurant_id: selectedRestaurant.id,
      products: cart.map((c) => ({ product_id: c.id, quantity: c.quantity })),
    };
    await api.post("/orders", payload);
    alert("✅ تم إضافة الطلب");
    setShowAddOrderModal(false);
    setCart([]);
    fetchOrders();
  };
     
  // ====================================
  //                JSX
  // ====================================
  return (
    <div className="space-y-6">
      {/* ===== رأس الصفحة ===== */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">الطلبات</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddOrderModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> إضافة طلب
          </button>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 تحديث
          </button>
        </div>
      </div>

      {/* ===== جدول الطلبات ===== */}
      {loading ? (
        <div className="p-6 text-center">⏳ جاري التحميل...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th>رقم</th>
                <th>العميل</th>
                <th>المطعم</th>
                <th>الكابتن</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>تفاصيل</th>
                <th>تعيين كابتن</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50 text-center">
                  <td>#{o.id}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.restaurant_name}</td>
                  <td>{o.captain_name || "لم يُعيّن"}</td>
                  <td>{formatAmount(o.total_amount)}</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="preparing">قيد التحضير</option>
                      <option value="ready">جاهز</option>
                      <option value="delivering">قيد التوصيل</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => openDetailsModal(o.id)}
                      className="text-blue-600 hover:underline"
                    >
                      عرض
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => openCaptainModal(o.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      تعيين
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== مودال تعيين الكابتن ===== */}
      {isCaptainModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold">🚗 اختر الكابتن</h2>
              <button onClick={() => setIsCaptainModalOpen(false)}>✖</button>
            </div>
            {captainsLoading ? (
              <div className="py-6 text-center">⏳ جاري التحميل...</div>
            ) : captains.length === 0 ? (
              <div className="py-6 text-center">❌ لا يوجد كباتن متاحين</div>
            ) : (
              <ul className="divide-y mt-4">
                {captains.map((c) => (
                  <li key={c.id} className="flex justify-between items-center py-3">
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-gray-600">
                        🕓 معلقة: {c.pending_orders} | ✅ مكتملة اليوم: {c.completed_today}
                      </p>
                    </div>
                    <button
                      onClick={() => assignCaptain(c.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      تعيين
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 text-right">
              <button
                onClick={() => setIsCaptainModalOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== مودال تفاصيل الطلب ===== */}
      {isDetailsModalOpen && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div ref={printRef} className="p-6 overflow-y-auto">
              <h2 className="text-lg font-bold mb-4 text-center">
                🧾 فاتورة الطلب #{selectedOrderDetails.id}
              </h2>
              <table className="w-full mb-4 border">
                <thead className="bg-gray-100">
                  <tr>
                    <th>المنتج</th>
                    <th>السعر</th>
                    <th>الكمية</th>
                    <th>الخصم</th>
                    <th>الإجمالي</th>
                    <th>الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderDetails.products.map((p, idx) => {
                    const subtotal = p.price * p.quantity - (p.discount || 0);
                    return (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{p.name}</td>
                        <td className="border">{p.price} ر.س</td>
                        <td className="border">{p.quantity}</td>
                        <td className="border">{p.discount ? `${p.discount} ر.س` : "-"}</td>
                        <td className="border font-semibold text-green-600">{subtotal} ر.س</td>
                        <td className="border">{p.notes || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="border p-3 rounded mb-4">
                <p>📦 رسوم التوصيل: {Number(selectedOrderDetails.delivery_fee || 0)} ريال</p>
                <p>
                  💰 الإجمالي الكلي:{" "}
                  <strong className="text-blue-600">
                    {(
                      selectedOrderDetails.products.reduce(
                        (sum, p) => sum + (p.price * p.quantity - (p.discount || 0)),
                        0
                      ) + Number(selectedOrderDetails.delivery_fee || 0)
                    ).toFixed(2)}{" "}
                    ريال
                  </strong>
                </p>
              </div>

              {/* تفاصيل المطعم والعميل */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border p-3 rounded">
                  <h3 className="font-bold mb-1">🏪 بيانات المطعم</h3>
                  <p>الاسم: {selectedOrderDetails.restaurant_name}</p>
                  <p>الهاتف: {selectedOrderDetails.restaurant_phone}</p>
                </div>

                <div className="border p-3 rounded">
                  <h3 className="font-bold mb-1">👤 بيانات العميل</h3>
                  <p>الاسم: {selectedOrderDetails.customer_name}</p>
                  <p>الهاتف: {selectedOrderDetails.customer_phone}</p>
                  <p>📍 العنوان: {selectedOrderDetails.customer_address}</p>
                  <p>
                    🧭 الإحداثيات: {selectedOrderDetails.latitude}, {selectedOrderDetails.longitude}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${selectedOrderDetails.latitude},${selectedOrderDetails.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    عرض على الخريطة 🌍
                  </a>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-100">
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                🧾 طباعة الفاتورة
              </button>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== مودال إضافة الطلب ===== */}
      {showAddOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">➕ إضافة طلب جديد</h2>
            <label>👤 اختر العميل:</label>
            <select onChange={(e) => selectCustomer(Number(e.target.value))}>
              <option value="">-- اختر --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {selectedCustomer && <div>📞 {selectedCustomer.phone}</div>}
            <label>📍 اختر العنوان:</label>
            <select
              onChange={(e) =>
                setSelectedAddress(addresses.find((a) => a.id == e.target.value))
              }
            >
              <option value="">-- اختر --</option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.address}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="🌍 رابط GPS"
              value={gpsLink}
              onChange={(e) => setGpsLink(e.target.value)}
              className="border w-full p-2 mt-2 mb-2 rounded"
            />
            <label>🏪 اختر المطعم:</label>
            <select onChange={(e) => selectRestaurant(Number(e.target.value))}>
              <option value="">-- اختر --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              onClick={openProductsModal}
              className="bg-blue-600 text-white px-3 py-1 mt-3 rounded"
            >
              📦 تحديد المنتجات
            </button>
            <h3 className="font-bold mt-4">🛒 السلة:</h3>
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between border-b py-1">
                <span>{item.name}</span>
                <span>
                  {item.quantity} × {item.price} ريال
                </span>
              </div>
            ))}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={saveOrder}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                💾 حفظ
              </button>
              <button
                onClick={() => setShowAddOrderModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== مودال اختيار المنتجات ===== */}
      {showProductsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">📦 قائمة المنتجات</h2>
            <div className="flex gap-3 overflow-x-auto border-b pb-2">
              {restaurantCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {products
                .filter((p) => !selectedCategory || p.category_id === selectedCategory)
                .map((p) => (
                  <div key={p.id} className="border p-2 rounded flex flex-col justify-between">
                    <span className="font-bold">{p.name}</span>
                    <span>{p.price} ريال</span>
                    <button
                      onClick={() => addToCart(p)}
                      className="bg-green-600 text-white mt-2 px-3 py-1 rounded"
                    >
                      ➕ إضافة
                    </button>
                  </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowProductsModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
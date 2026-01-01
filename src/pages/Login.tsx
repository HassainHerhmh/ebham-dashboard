import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ إذا المستخدم مسجل مسبقًا → توجه مباشرة للصفحة الرئيسية
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) navigate("/");
  }, [navigate]);

  // ✅ إرسال بيانات تسجيل الدخول
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (!data.success) {
        setError(data.message || "❌ خطأ في تسجيل الدخول");
      } else {
        // حفظ بيانات المستخدم في التخزين المحلي بما فيها الصلاحيات
        localStorage.setItem("user", JSON.stringify(data.user));

        // 🔄 إعلام باقي أجزاء التطبيق بتحديث الحالة
        window.dispatchEvent(new Event("storage"));

        alert("✅ تم تسجيل الدخول بنجاح");
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("❌ خطأ:", err);
      setError("❌ فشل الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-center mb-6">تسجيل الدخول</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 text-right font-medium">
            البريد الإلكتروني أو رقم الجوال
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full border rounded px-3 py-2 text-right focus:ring focus:ring-blue-200"
            placeholder="example@mail.com أو 05XXXXXXXX"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-right font-medium">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 text-right focus:ring focus:ring-blue-200"
            placeholder="أدخل كلمة المرور"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "جاري التحقق..." : "تسجيل الدخول"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-3">
          © {new Date().getFullYear()} جميع الحقوق محفوظة
        </p>
      </form>
    </div>
  );
};

export default Login;
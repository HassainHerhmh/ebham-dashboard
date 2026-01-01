import React from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <div className="bg-white shadow p-8 rounded-lg max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-red-100 text-red-600 p-4 rounded-full mb-3">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">🚫 ليس لديك صلاحية</h2>
          <p className="text-gray-600 mb-4">
            يبدو أنك لا تملك صلاحية للوصول إلى هذه الصفحة.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
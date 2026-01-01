import axios from "axios";

/* =========================
   🔗 Base URL (Vite)
========================= */
const API_URL = import.meta.env.VITE_API_URL;

/* =========================
   🟢 Axios Instance
========================= */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================
   🟢 Interceptor
========================= */
apiClient.interceptors.request.use((config) => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
      if (user.role) {
        config.headers["x-user-role"] = user.role;
      }
    } catch {}
  }
  return config;
});

/* =========================
   🧠 API Facade (نفس شغلك)
========================= */
const api = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  delete: apiClient.delete,

  orders: {
    getOrders: (params?: any) =>
      apiClient.get("/orders", { params }).then(res => res.data),

    getOrderDetails: (id: number) =>
      apiClient.get(`/orders/${id}`).then(res => res.data),

    assignCaptain: (orderId: number, captainId: number) =>
      apiClient.post(`/orders/${orderId}/assign-captain`, { captain_id: captainId }),

    updateStatus: (orderId: number, status: string) =>
      apiClient.put(`/orders/${orderId}/status`, { status }),
  },

  captains: {
    getAvailableCaptains: () =>
      apiClient.get("/captains").then(res => res.data),
  },
};



/* ======================================================
   🟢 Interceptor: إرسال بيانات المستخدم مع كل طلب
====================================================== */
apiClient.interceptors.request.use((config) => {
  const userStr = localStorage.getItem("user");

  if (userStr) {
    try {
      const user = JSON.parse(userStr);

      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }

      if (user.role) {
        config.headers["x-user-role"] = user.role;
      }
    } catch {
      console.warn("Failed to parse user from localStorage");
    }
  }

  return config;
});

/* ======================================================
   🟢 Interceptor: الأخطاء
====================================================== */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default {
  // ===== دوال عامة =====
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  patch: apiClient.patch,
  delete: apiClient.delete,

  /* ======================================================
     🧾 الطلبات
  ====================================================== */
  orders: {
    getOrders: (params?: { limit?: number }) =>
      apiClient.get("/orders", { params }).then((res) => res.data),

    getOrderDetails: (orderId: number) =>
      apiClient.get(`/orders/${orderId}/details`).then((res) => res.data),

    assignCaptain: (orderId: number, captainId: number) =>
      apiClient
        .put(`/orders/${orderId}/assign-captain`, { captain_id: captainId })
        .then((res) => res.data),

    updateStatus: (orderId: number, status: string) =>
      apiClient
        .put(`/orders/${orderId}/status`, { status })
        .then((res) => res.data),
  },

  /* ======================================================
     🚗 الكباتن
  ====================================================== */
  captains: {
    getAvailableCaptains: () =>
      apiClient.get("/captains/available").then((res) => res.data),
  },

  /* ======================================================
     👥 المستخدمين
  ====================================================== */
  users: {
    getUsers: () => apiClient.get("/users").then((res) => res.data),

    addUser: (formData: FormData) =>
      apiClient.post("/users", formData).then((res) => res.data),

    updateUser: (id: number, formData: FormData) =>
      apiClient.put(`/users/${id}`, formData).then((res) => res.data),

    deleteUser: (id: number) =>
      apiClient.delete(`/users/${id}`).then((res) => res.data),

    disableUser: (id: number) =>
      apiClient.put(`/users/${id}/disable`).then((res) => res.data),

    resetPassword: (id: number) =>
      apiClient.put(`/users/${id}/reset-password`).then((res) => res.data),
  },

  /* ======================================================
     🧩 الأقسام (Sections) ✅ مضاف
  ====================================================== */
  sections: {
    getSections: () =>
      apiClient.get("/sections").then((res) => res.data),
  },

  /* ======================================================
     👥 الوكلاء (Agents)
  ====================================================== */
  agents: {
    getAgents: () =>
      apiClient.get("/agents").then((res) => res.data),

    getAgent: (id: number) =>
      apiClient.get(`/agents/${id}`).then((res) => res.data),

    addAgent: (data: {
      name: string;
      email?: string;
      phone?: string;
      password: string;
      address?: string;
    }) =>
      apiClient.post("/agents", data).then((res) => res.data),

    updateAgent: (id: number, data: any) =>
      apiClient.put(`/agents/${id}`, data).then((res) => res.data),

    toggleAgent: (id: number, is_active: boolean) =>
      apiClient
        .patch(`/agents/${id}/toggle`, { is_active })
        .then((res) => res.data),

    deleteAgent: (id: number) =>
      apiClient.delete(`/agents/${id}`).then((res) => res.data),
  },

  /* ======================================================
     👥 مجموعات الوكلاء
  ====================================================== */
  agentGroups: {
    getGroups: () =>
      apiClient.get("/agent-groups").then((res) => res.data),

    addGroup: (data: { name: string; code: string }) =>
      apiClient.post("/agent-groups", data).then((res) => res.data),

    updateGroup: (
      id: number,
      data: { name: string; code: string; status?: string }
    ) =>
      apiClient.put(`/agent-groups/${id}`, data).then((res) => res.data),

    deleteGroup: (id: number) =>
      apiClient.delete(`/agent-groups/${id}`).then((res) => res.data),
  },

  /* ======================================================
     📒 الحسابات
  ====================================================== */
  accounts: {
    getAccounts: () =>
      apiClient.get("/accounts").then((res) => res.data),

    addAccount: (data: {
      code?: string;
      name?: string;
      type?: string;
      currency?: string;
      opening_balance?: number;
    }) =>
      apiClient.post("/accounts", data).then((res) => res.data),

    createAccount: (data: {
      name_ar: string;
      name_en?: string;
      parent_id?: number | null;
      account_level?: "رئيسي" | "فرعي";
    }) =>
      apiClient.post("/accounts", data).then((res) => res.data),

    updateAccount: (id: number, data: any) =>
      apiClient.put(`/accounts/${id}`, data).then((res) => res.data),

    deleteAccount: (id: number) =>
      apiClient.delete(`/accounts/${id}`).then((res) => res.data),
  },

  /* ======================================================
     🏙️ المدن + الأحياء
  ====================================================== */
  cities: {
    getCities: () =>
      apiClient.get("/cities").then((res) => res.data),

    addCity: (name: string, delivery_fee: number) =>
      apiClient
        .post("/cities", { name, delivery_fee })
        .then((res) => res.data),

    deleteCity: (id: number) =>
      apiClient.delete(`/cities/${id}`).then((res) => res.data),

    searchNeighborhoods: (search: string = "") =>
      apiClient
        .get("/neighborhoods", { params: { search } })
        .then((res) => res.data),

    addNeighborhood: (
      city_id: number,
      name: string,
      delivery_fee: number
    ) =>
      apiClient
        .post(`/cities/${city_id}/neighborhoods`, {
          name,
          delivery_fee,
        })
        .then((res) => res.data),

    updateNeighborhood: (
      id: number,
      name: string,
      delivery_fee: number,
      city_id: number
    ) =>
      apiClient
        .put(`/neighborhoods/${id}`, {
          name,
          delivery_fee,
          city_id,
        })
        .then((res) => res.data),

    deleteNeighborhood: (id: number) =>
      apiClient.delete(`/neighborhoods/${id}`).then((res) => res.data),
  },
    /* ======================================================
   💳 طرق الدفع (Payment Methods)
====================================================== */
paymentMethods: {
  getAll: () =>
    apiClient.get("/payment-methods").then(res => res.data),

  add: (data: {
    company: string;
    account_number: string;
    owner_name: string;
    address?: string;
  }) =>
    apiClient.post("/payment-methods", data).then(res => res.data),

  update: (id: number, data: any) =>
    apiClient.put(`/payment-methods/${id}`, data).then(res => res.data),

  delete: (id: number) =>
    apiClient.delete(`/payment-methods/${id}`).then(res => res.data),

  toggle: (id: number, is_active: boolean) =>
    apiClient
      .patch(`/payment-methods/${id}/toggle`, { is_active })
      .then(res => res.data),
},

   /* ======================================================
   💱 العملات (Currencies) ✅ مضاف
====================================================== */
currencies: {
  getAll: () =>
    apiClient.get("/currencies").then((res) => res.data),

  create: (data: {
    name_ar: string;
    code: string;
    symbol?: string;
    exchange_rate?: number;
    min_rate?: number;
    max_rate?: number;
    is_local?: boolean;
  }) =>
    apiClient.post("/currencies", data).then((res) => res.data),

  update: (id: number, data: any) =>
    apiClient.put(`/currencies/${id}`, data).then((res) => res.data),

  delete: (id: number) =>
    apiClient.delete(`/currencies/${id}`).then((res) => res.data),
},

/* ======================================================
   🏦 البنوك (Banks) ✅ مضاف
====================================================== */
banks: {
  // جلب دليل البنوك
  getBanks: (params?: { search?: string }) =>
    apiClient
      .get("/banks", { params })
      .then((res) => res.data),

  // إضافة بنك (مع إنشاء حساب)
  addBank: (data: {
    name_ar: string;
    name_en?: string;
    code: string;
    bank_group_id: number;
    parent_account_id: number;
    created_by?: number;
  }) =>
    apiClient
      .post("/banks", data)
      .then((res) => res.data),

  // حذف بنك
  deleteBank: (id: number) =>
    apiClient
      .delete(`/banks/${id}`)
      .then((res) => res.data),
      
  //تعديل بنك
  updateBank: (
  id: number,
  data: {
    name_ar: string;
    name_en?: string;
    bank_group_id: number;
  }
) =>
  apiClient
    .put(`/banks/${id}`, data)
    .then(res => res.data),

},
 
    /* ======================================================
     💰 مجموعات الصناديق (Cash Box Groups)
  ====================================================== */
  cashBoxGroups: {
    getAll: (params?: { search?: string }) =>
      apiClient
        .get("/cashbox-groups", { params })
        .then(res => res.data),

    add: (data: {
      name_ar: string;
      name_en?: string;
      code: string;
      created_by?: number;
    }) =>
      apiClient
        .post("/cashbox-groups", data)
        .then(res => res.data),

    update: (
      id: number,
      data: {
        name_ar: string;
        name_en?: string;
      }
    ) =>
      apiClient
        .put(`/cashbox-groups/${id}`, data)
        .then(res => res.data),

    delete: (id: number) =>
      apiClient
        .delete(`/cashbox-groups/${id}`)
        .then(res => res.data),
  },

  /* ======================================================
     💵 الصناديق النقدية (Cash Boxes)
  ====================================================== */
  cashBoxes: {
    getAll: (params?: { search?: string }) =>
      apiClient
        .get("/cash-boxes", { params })
        .then(res => res.data),

    add: (data: {
      name_ar: string;
      name_en?: string;
      code: string;
      cashbox_group_id: number;
      parent_account_id: number;
      created_by?: number;
    }) =>
      apiClient
        .post("/cash-boxes", data)
        .then(res => res.data),

    update: (
      id: number,
      data: {
        name_ar: string;
        name_en?: string;
        cashbox_group_id: number;
      }
    ) =>
      apiClient
        .put(`/cash-boxes/${id}`, data)
        .then(res => res.data),

    delete: (id: number) =>
      apiClient
        .delete(`/cash-boxes/${id}`)
        .then(res => res.data),
  },
  
    /* ======================================================
     🧾 أنواع سندات القبض (Receipt Types)
  ====================================================== */
  receiptTypes: {
    getAll: (params?: { search?: string }) =>
      apiClient
        .get("/receipt-types", { params })
        .then(res => res.data),

    add: (data: {
      code: number;
      name_ar: string;
      name_en?: string;
      sort_order: number;
    }) =>
      apiClient
        .post("/receipt-types", data)
        .then(res => res.data),

    update: (
      id: number,
      data: {
        name_ar: string;
        name_en?: string;
        sort_order: number;
      }
    ) =>
      apiClient
        .put(`/receipt-types/${id}`, data)
        .then(res => res.data),

    delete: (id: number) =>
      apiClient
        .delete(`/receipt-types/${id}`)
        .then(res => res.data),
  },

  /* ======================================================
     💸 أنواع سندات الصرف (Payment Types)
  ====================================================== */
  paymentTypes: {
    getAll: (params?: { search?: string }) =>
      apiClient
        .get("/payment-types", { params })
        .then(res => res.data),

    add: (data: {
      code: number;
      name_ar: string;
      name_en?: string;
      sort_order: number;
    }) =>
      apiClient
        .post("/payment-types", data)
        .then(res => res.data),

    update: (
      id: number,
      data: {
        name_ar: string;
        name_en?: string;
        sort_order: number;
      }
    ) =>
      apiClient
        .put(`/payment-types/${id}`, data)
        .then(res => res.data),

    delete: (id: number) =>
      apiClient
        .delete(`/payment-types/${id}`)
        .then(res => res.data),
  },

  /* ======================================================
     📘 أنواع قيود اليومية (Journal Types)
  ====================================================== */
  journalTypes: {
    getAll: (params?: { search?: string }) =>
      apiClient
        .get("/journal-types", { params })
        .then(res => res.data),

    add: (data: {
      code: number;
      name_ar: string;
      name_en?: string;
      sort_order: number;
    }) =>
      apiClient
        .post("/journal-types", data)
        .then(res => res.data),

    update: (
      id: number,
      data: {
        name_ar: string;
        name_en?: string;
        sort_order: number;
      }
    ) =>
      apiClient
        .put(`/journal-types/${id}`, data)
        .then(res => res.data),

    delete: (id: number) =>
      apiClient
        .delete(`/journal-types/${id}`)
        .then(res => res.data),
  },
/* ======================================================
   📊 تسقيف الحسابات (Account Ceilings)
====================================================== */
accountCeilings: {
  // جلب جميع التسقيف
  getAll: () =>
    apiClient
      .get("/account-ceilings")
      .then(res => res.data),

  // إضافة تسقيف
  add: (data: {
    scope: "account" | "group";
    account_id?: number | null;
    account_group_id?: number | null;
    currency_id: number;
    ceiling_amount: number;

    // ✅ مطابق للسيرفر
    account_nature: "debit" | "credit";
    exceed_action: "block" | "allow" | "warn";

    created_by?: number;
  }) =>
    apiClient
      .post("/account-ceilings", data)
      .then(res => res.data),

  // تعديل تسقيف
  update: (
    id: number,
    data: {
      currency_id: number;
      ceiling_amount: number;

      // ✅ مطابق للسيرفر
      account_nature: "debit" | "credit";
      exceed_action: "block" | "allow" | "warn";
    }
  ) =>
    apiClient
      .put(`/account-ceilings/${id}`, data)
      .then(res => res.data),

  // حذف تسقيف (Soft Delete)
  delete: (id: number) =>
    apiClient
      .delete(`/account-ceilings/${id}`)
      .then(res => res.data),
},
/* ======================================================
   🧾 سندات القبض (Receipt Vouchers)
====================================================== */
receiptVouchers: {
  getAll: (params?: {
    search?: string;
    date?: string;
    allDates?: boolean;
  }) =>
    apiClient.get("/receipt-vouchers", { params }).then(res => res.data),

  getOne: (id: number) =>
    apiClient.get(`/receipt-vouchers/${id}`).then(res => res.data),

  add: (data: {
    voucher_no: string;
    voucher_date: string;
    receipt_type: "cash" | "bank";
    cash_box_account_id?: number | null;
    bank_account_id?: number | null;
    transfer_no?: string | null;
    currency_id: number;
    amount: number;
    account_id: number;
    analytic_account_id?: number | null;
    cost_center_id?: number | null;
    journal_type_id: number;
    handling?: number;
    notes?: string;
    created_by?: number;
    branch_id?: number;
  }) =>
    apiClient.post("/receipt-vouchers", data).then(res => res.data),

  // ✅ الجديد
  update: (id: number, data: {
    voucher_date: string;
    receipt_type: "cash" | "bank";
    cash_box_account_id?: number | null;
    bank_account_id?: number | null;
    transfer_no?: string | null;
    currency_id: number;
    amount: number;
    account_id: number;
    analytic_account_id?: number | null;
    cost_center_id?: number | null;
    handling?: number;
    notes?: string;
  }) =>
    apiClient.put(`/receipt-vouchers/${id}`, data).then(res => res.data),

  delete: (id: number) =>
    apiClient.delete(`/receipt-vouchers/${id}`).then(res => res.data),
},

/* ======================================================
   💸 Payment Vouchers (سندات الصرف)
====================================================== */
paymentVouchers: {
  // 🔹 جلب جميع سندات الصرف
  getAll: (params?: {
    search?: string;
    date?: string;
    allDates?: boolean;
  }) =>
    apiClient
      .get("/payment-vouchers", { params })
      .then(res => res.data),

  // 🔹 جلب سند صرف واحد
  getOne: (id: number) =>
    apiClient
      .get(`/payment-vouchers/${id}`)
      .then(res => res.data),

  // 🔹 إضافة سند صرف
  add: (data: {
    voucher_no: string;
    voucher_date: string;

    // نوع الصرف
    payment_type: "cash" | "bank";

    // صندوق أو بنك
    cash_box_account_id?: number | null;
    bank_account_id?: number | null;

    // رقم الحوالة (اختياري)
    transfer_no?: string | null;

    // العملة
    currency_id: number;

    // المبلغ
    amount: number;

    // الحساب المدين
    account_id: number;

    // اختياري
    analytic_account_id?: number | null;
    cost_center_id?: number | null;

    // إضافي
    handling?: number;
    notes?: string;

    // بيانات النظام
    created_by?: number;
    branch_id?: number;
  }) =>
    apiClient
      .post("/payment-vouchers", data)
      .then(res => res.data),

  // 🔹 تعديل سند صرف
  update: (
    id: number,
    data: {
      voucher_date: string;
      payment_type: "cash" | "bank";
      cash_box_account_id?: number | null;
      bank_account_id?: number | null;
      transfer_no?: string | null;
      currency_id: number;
      amount: number;
      account_id: number;
      analytic_account_id?: number | null;
      cost_center_id?: number | null;
      handling?: number;
      notes?: string;
    }
  ) =>
    apiClient
      .put(`/payment-vouchers/${id}`, data)
      .then(res => res.data),

  // 🔹 حذف سند صرف
  delete: (id: number) =>
    apiClient
      .delete(`/payment-vouchers/${id}`)
      .then(res => res.data),
},

/* ======================================================
   🧾 Journal Entries API
====================================================== */
journalEntries: {
  // جلب القيود
  getAll: () =>
    apiClient.get("/journal-entries").then(res => res.data),

  // إضافة قيد
  add: (data: {
    journal_date: string;
    account_id: number;
    debit?: number;
    credit?: number;
    currency_id: number;
    cost_center_id?: number;
    notes?: string;
  }) =>
    apiClient.post("/journal-entries", data).then(res => res.data),

  // ✏️ تعديل قيد
  update: (
    id: number,
    data: {
      account_id: number;
      debit?: number;
      credit?: number;
      currency_id: number;
      cost_center_id?: number;
      notes?: string;
    }
  ) =>
    apiClient.put(`/journal-entries/${id}`, data).then(res => res.data),

  // حذف قيد
  delete: (id: number) =>
    apiClient.delete(`/journal-entries/${id}`).then(res => res.data),
},


};

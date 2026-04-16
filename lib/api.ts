// lib/api.ts
import { getToken, logout, isTokenExpired } from "./auth";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export function authHeaders(extra: HeadersInit = {}) {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ========== API FETCH ==========
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // Don't check token expiry for login endpoint
  const isLoginRequest = endpoint.includes('/login');

  if (!isLoginRequest && isTokenExpired()) {
    logout();
    throw new Error("Session expired");
  }

  const token = getToken();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized
  if (res.status === 401) {
    if (!isLoginRequest) {
      logout();
    }
    throw new Error("Invalid credentials");
  }

  // Handle 403 Forbidden
  if (res.status === 403) {
    throw new Error("You don't have permission to perform this action");
  }

  const text = await res.text();

  // Parse JSON
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) throw new Error(text || `Request failed (${res.status})`);
    return text;
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }

  return data;
}

// ========== TYPED API METHODS ==========
export const api = {
  get: (endpoint: string) =>
    apiFetch(endpoint, { method: "GET" }),

  post: (endpoint: string, body?: any) =>
    apiFetch(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined
    }),

  put: (endpoint: string, body?: any) =>
    apiFetch(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined
    }),

  patch: (endpoint: string, body?: any) =>
    apiFetch(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined
    }),

  delete: (endpoint: string) =>
    apiFetch(endpoint, { method: "DELETE" }),

  upload: async (endpoint: string, formData: FormData) => {
    const token = getToken();
    if (!token) {
      logout();
      throw new Error("Not authenticated");
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.status === 401) {
      logout();
      throw new Error("Session expired");
    }

    const text = await res.text();
    try {
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Upload failed");
      }
      return data;
    } catch (error) {
      if (!res.ok) throw new Error(text || "Upload failed");
      return text;
    }
  },
};

// ========== AUTH API ==========
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/dashboard/auth/login", { email, password }),

  getProfile: () =>
    api.get("/dashboard/auth/me"),

  changePassword: (current_password: string, new_password: string) =>
    api.post("/dashboard/auth/change-password", { current_password, new_password }),
};

// ========== SALON API (for backwards compatibility and admin use) ==========
export const salonApi = {
  getAll: () => api.get("/dashboard/admin/salons"),
  getById: (id: string) => api.get(`/dashboard/admin/salons/${id}`),
  create: (data: any) => api.post("/dashboard/admin/salons", data),
  update: (id: string, data: any) => api.put(`/dashboard/admin/salons/${id}`, data),
  delete: (id: string) => api.delete(`/dashboard/admin/salons/${id}`),
  toggleActive: (id: string) => api.patch(`/dashboard/admin/salons/${id}/toggle-active`),
  getMe: () => api.get("/dashboard/salon/me"),

};

// ========== USERS API ==========
export const userApi = {
  getAll: (params?: {
    search?: string;
    status?: string;
    sort?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();

    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    return api.get(`/dashboard/admin/users${qs ? `?${qs}` : ""}`);
  },

  getStats: () => api.get("/dashboard/admin/users/stats"),

  getById: (id: string) => api.get(`/dashboard/admin/users/${id}`),

  update: (id: string, data: any) =>
    api.put(`/dashboard/admin/users/${id}`, data),

  toggleBlock: (id: string) =>
    api.post(`/dashboard/admin/users/${id}/toggle-block`),
};

// ========== BOOKINGS API ==========
export const bookingApi = {
  getAll: (status?: string) =>
    api.get(`/dashboard/admin/bookings${status ? `?status=${status}` : ''}`),
  getById: (id: string) => api.get(`/dashboard/admin/bookings/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/dashboard/admin/bookings/${id}/status`, { status }),
};

// ========== GIFT THEMES API ==========
export const giftThemeApi = {
  getAll: () => api.get("/dashboard/admin/gift-themes"),
  getById: (id: string) => api.get(`/dashboard/admin/gift-themes/${id}`),
  create: (data: any) => api.post("/dashboard/admin/gift-themes", data),
  update: (id: string, data: any) => api.patch(`/dashboard/admin/gift-themes/${id}`, data),
  delete: (id: string) => api.delete(`/dashboard/admin/gift-themes/${id}`),
  toggleActive: (id: string) => api.patch(`/dashboard/admin/gift-themes/${id}/toggle-active`),
  reorder: (ids: string[]) => api.post("/dashboard/admin/gift-themes/reorder", { ids }),
  
  // Upload image file
  upload: async (file: File): Promise<{ ok: boolean; url: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/dashboard/admin/gift-themes/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Upload failed");
    }

    return res.json();
  },
};


// ========== FEEDBACK API ==========
export const feedbackApi = {
  getAll: () => api.get("/dashboard/admin/feedback"),
  updateApproval: (id: string, is_approved: boolean) =>
    api.patch(`/dashboard/admin/feedback/${id}/approval`, { is_approved }),
  respond: (id: string, response: string) =>
    api.patch(`/dashboard/admin/feedback/${id}/respond`, { response }),
};

// ========== STATS API ==========
export const statsApi = {
  getDashboard: () => api.get("/dashboard/admin/stats"),
  getSalonStats: () => api.get("/dashboard/salon/stats"),
};

// ========== SALON OWNER - PROFILE API ==========
export const salonProfileApi = {
  get: () => api.get("/dashboard/salon/me"),
  update: (data: any) => api.put("/dashboard/salon/me", data),

  uploadLogo: (formData: FormData) =>
    api.upload("/dashboard/salon/me/logo", formData),

  uploadCover: (formData: FormData) =>
    api.upload("/dashboard/salon/me/cover", formData),
};

// ========== SALON OWNER - BRANCHES API ==========
export const branchApi = {
  getAll: () => api.get("/dashboard/salon/branches"),
  getById: (id: string) => api.get(`/dashboard/salon/branches/${id}`),
  create: (data: any) => api.post("/dashboard/salon/branches", data),
  update: (id: string, data: any) => api.put(`/dashboard/salon/branches/${id}`, data),
  delete: (id: string) => api.delete(`/dashboard/salon/branches/${id}`),
  toggleActive: (id: string) => api.patch(`/dashboard/salon/branches/${id}/toggle-active`),
  updateHours: (branchId: string, hours: any[]) =>
    api.post(`/dashboard/salon/branches/${branchId}/hours/upsert`, { hours }),
};

// ========== SALON OWNER - STAFF API ==========
export const staffApi = {
  getAll: () => api.get("/dashboard/salon/staff"),
  getById: (id: string) => api.get(`/dashboard/salon/staff/${id}`),
  create: (data: any) => api.post("/dashboard/salon/staff", data),
  update: (id: string, data: any) => api.put(`/dashboard/salon/staff/${id}`, data),
  delete: (id: string) => api.delete(`/dashboard/salon/staff/${id}`),
  toggleActive: (id: string) => api.patch(`/dashboard/salon/staff/${id}/toggle-active`),
  updateServices: (staffId: string, service_ids: string[]) =>
    api.post(`/dashboard/salon/staff/${staffId}/services`, { service_ids }),
};

// ========== SALON OWNER - CATEGORIES API ==========
export const categoryApi = {
  getAll: () => api.get("/dashboard/salon/categories"),
  getById: (id: string) => api.get(`/dashboard/salon/categories/${id}`),
  create: (data: any) => api.post("/dashboard/salon/categories", data),
  update: (id: string, data: any) => api.put(`/dashboard/salon/categories/${id}`, data),
  delete: (id: string) => api.delete(`/dashboard/salon/categories/${id}`),
  toggleActive: (id: string) => api.patch(`/dashboard/salon/categories/${id}/toggle-active`),
  reorder: (category_ids: string[]) =>
    api.post("/dashboard/salon/categories/reorder", { category_ids }),
};

// ========== SALON OWNER - SERVICES API ==========
export const serviceApi = {
  getAll: (category_id?: string) =>
    api.get(`/dashboard/salon/services${category_id ? `?category_id=${category_id}` : ''}`),
  getById: (id: string) => api.get(`/dashboard/salon/services/${id}`),
  create: (data: any) => api.post("/dashboard/salon/services", data),
  update: (id: string, data: any) => api.put(`/dashboard/salon/services/${id}`, data),
  delete: (id: string) => api.delete(`/dashboard/salon/services/${id}`),
  toggleActive: (id: string) => api.patch(`/dashboard/salon/services/${id}/toggle-active`),
  getAvailability: (serviceId: string) =>
    api.get(`/dashboard/salon/services/${serviceId}/availability`),
  updateAvailability: (serviceId: string, availability: any[]) =>
    api.post(`/dashboard/salon/services/${serviceId}/availability/upsert`, { availability }),
  uploadImage: (serviceId: string, formData: FormData) =>
    api.upload(`/dashboard/salon/services/${serviceId}/image`, formData),
};

// ========== SALON OWNER - BOOKINGS API ==========
export const salonBookingApi = {
  getAll: (status?: string) =>
    api.get(`/dashboard/salon/bookings${status ? `?status=${status}` : ""}`),
  getById: (id: string) => api.get(`/dashboard/salon/bookings/${id}`),
  updateStatus: (id: string, status: string) =>
    api.put(`/dashboard/salon/bookings/${id}/status`, { status }),
};

// reviews
export const reviewApi = {
  getAll: (rating?: string, branch_id?: string) => {
    const params = new URLSearchParams();
    if (rating) params.set("rating", rating);
    if (branch_id) params.set("branch_id", branch_id);

    const qs = params.toString();
    return api.get(`/dashboard/salon/reviews${qs ? `?${qs}` : ""}`);
  },

  getStats: () => api.get("/dashboard/salon/reviews/stats"),
};

// ========== NOTIFICATIONS API ==========
export const notificationApi = {
  send: (data: {
    title: string;
    body: string;
    targetType: "all" | "specific_user" | "user_segment";
    userId?: string;
    segment?: string;
    type?: string;
    data?: any;
  }) => api.post("/dashboard/admin/notifications/send", data),
};


// ========== BLOCKED TIME SLOTS API ==========
export const blockedSlotsApi = {
  // Get all blocked slots
  getAll: (params?: { branch_id?: string; date?: string; staff_id?: string }) => {
    const query = new URLSearchParams();
    if (params?.branch_id) query.set("branch_id", params.branch_id);
    if (params?.date) query.set("date", params.date);
    if (params?.staff_id) query.set("staff_id", params.staff_id);
    
    const qs = query.toString();
    return api.get(`/dashboard/salon/blocked-slots${qs ? `?${qs}` : ""}`);
  },

  // Get calendar view
  getCalendar: (params: { month: string; branch_id?: string; staff_id?: string }) => {
    const query = new URLSearchParams();
    query.set("month", params.month);
    if (params.branch_id) query.set("branch_id", params.branch_id);
    if (params.staff_id) query.set("staff_id", params.staff_id);
    
    return api.get(`/dashboard/salon/blocked-slots/calendar?${query.toString()}`);
  },

  // Create blocked slot
  create: (data: {
    branch_id: string;
    staff_id?: string | null;
    blocked_date: string; // YYYY-MM-DD
    start_time: string;    // HH:MM
    end_time: string;      // HH:MM
    reason?: string;
    customer_name?: string;
    customer_phone?: string;
  }) => api.post("/dashboard/salon/blocked-slots", data),

  // Update blocked slot
  update: (id: string, data: {
    blocked_date?: string;
    start_time?: string;
    end_time?: string;
    reason?: string;
    customer_name?: string;
    customer_phone?: string;
  }) => api.put(`/dashboard/salon/blocked-slots/${id}`, data),

  // Delete blocked slot
  delete: (id: string) => api.delete(`/dashboard/salon/blocked-slots/${id}`),
};


// ========== MOBILE BANNERS API ==========
export const bannerApi = {
  getAll: (placement?: string) =>
    api.get(
      `/dashboard/admin/mobile-banners${
        placement ? `?placement=${encodeURIComponent(placement)}` : ""
      }`
    ),

  getById: (id: string) =>
    api.get(`/dashboard/admin/mobile-banners/${id}`),

  create: (data: any) =>
    api.post("/dashboard/admin/mobile-banners", data),

  update: (id: string, data: any) =>
    api.put(`/dashboard/admin/mobile-banners/${id}`, data),

  delete: (id: string) =>
    api.delete(`/dashboard/admin/mobile-banners/${id}`),

  reorder: (items: Array<{ id: string; sort_order: number }>) =>
    api.post("/dashboard/admin/mobile-banners/reorder", { items }),

  upload: async (file: File): Promise<{ ok: boolean; image_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    return api.upload("/dashboard/admin/mobile-banners/upload", formData);
  },
};


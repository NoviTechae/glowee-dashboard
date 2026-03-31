// lib/types.ts

export type UserRole = "admin" | "salon";

// The account object stored in localStorage after login
// Matches the shape of LoginResponse.account
export interface DashboardAccount {
  id: string;
  email: string;
  role: UserRole;
  salon_id?: string;
  is_active: boolean;
}

// What saveLoginData() receives — matches LoginResponse shape
export interface LoginData {
  token: string;
  account: DashboardAccount;
}

export interface Salon {
  id: string;
  name: string;
  salon_type: "in_salon" | "home" | "both";
  about?: string;
  logo_url?: string;
  cover_url?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  website?: string;
  is_active: boolean;
  rating?: number;
  reviews_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface Branch {
  id: string;
  salon_id: string;
  name: string;
  country: string;
  city: string;
  area: string;
  address_line?: string;
  lat: number;
  lng: number;
  supports_home_services: boolean;
  is_active: boolean;
  rating?: number;
  reviews_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  photo?: string;
  wallet_balance_aed?: number;
  is_active: boolean;
  is_blocked?: boolean;
  created_at: string;
  last_login?: string;
}

export interface Service {
  id: string;
  salon_id: string;
  category_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface ServiceAvailability {
  id: string;
  service_id: string;
  branch_id: string;
  mode: "in_salon" | "home";
  duration_mins: number;
  price_aed: number;
  travel_fee_aed?: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  salon_id: string;
  name: string;
  name_ar?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Staff {
  id: string;
  salon_id: string;
  branch_id: string;
  name: string;
  phone?: string;
  role?: string;
  bio?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  salon_id: string;
  salon_name?: string;
  branch_id?: string;
  branch_name?: string;
  scheduled_at: string;
  mode: "in_salon" | "home";
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  total_aed: number;
  subtotal_aed?: number;
  fees_aed?: number;
  customer_note?: string;
  created_at: string;
}

export interface DashboardStats {
  total_salons?: number;
  total_users?: number;
  total_bookings?: number;
  total_revenue?: number;
  pending_bookings?: number;
  active_bookings?: number;
  completed_bookings?: number;
  cancelled_bookings?: number;
  today_bookings?: number;
  this_month_revenue?: number;
  growth_rate?: number;
}

export interface GiftTheme {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface BranchHours {
  id?: string;
  branch_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  is_closed: boolean;
  open_time?: string; // "09:00"
  close_time?: string; // "22:00"
}

export interface ApiResponse<T> {
  ok?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  account: {
    id: string;
    email: string;
    role: "admin" | "salon";
    salon_id?: string;
    is_active: boolean;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
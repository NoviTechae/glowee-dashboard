// lib/utils.ts

// ========== CLASS NAMES UTILITY ==========
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}


// ========== FORMAT CURRENCY ==========
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}


// ========== FORMAT DATE ==========
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}


// ========== FORMAT DATETIME ==========
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}


// ========== FORMAT TIME ==========
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function getDayName(dayNumber: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayNumber] || "";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    paid: "bg-green-100 text-green-800",
    refunded: "bg-purple-100 text-purple-800",
  };
  return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}

// ========== TRUNCATE TEXT ==========
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  for (let minutes = start; minutes < end; minutes += intervalMinutes) {
    slots.push(formatMinutesToTime(minutes));
  }

  return slots;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+?971|0)?5[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

export function handleError(error: any): string {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return "An unexpected error occurred";
}

export function downloadFile(data: any, filename: string, type: string = "text/csv") {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Convert relative image paths to full backend URLs
 * Works for both dashboard and mobile app
 */
// ========== GET IMAGE URL ==========
export function getImageUrl(path?: string | null): string | null {
  if (!path) return null;
  
  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it's a relative path, prepend the backend URL
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
  
  // Remove leading slash if exists to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${API_BASE}/${cleanPath}`;
}

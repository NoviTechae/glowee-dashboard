// lib/auth.ts

const TOKEN_KEY = "dashboardToken";
const ACCOUNT_KEY = "dashboardAccount";

// ========== SAVE LOGIN DATA ==========
export function saveLoginData(data: { token: string; account: any }) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(data.account));
}

// ========== GET TOKEN ==========
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// ========== GET ACCOUNT ==========
export function getAccount(): any | null {
  if (typeof window === "undefined") return null;
  const acc = localStorage.getItem(ACCOUNT_KEY);
  return acc ? JSON.parse(acc) : null;
}

// ========== GET ROLE ==========
export function getRole(): string | null {
  const account = getAccount();
  return account?.role || null;
}

// ========== CHECK IF AUTHENTICATED ==========
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  // Check if token is expired (but DON'T call logout here!)
  if (isTokenExpired()) {
    return false;
  }

  return true;
}

// ========== CHECK IF TOKEN EXPIRED ==========
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;

  try {
    // Decode JWT (simple base64 decode - not cryptographic verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check expiry (exp is in seconds, Date.now() is in milliseconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    
    return false;
  } catch (error) {
    // If we can't decode, consider it expired
    return true;
  }
}

// ========== LOGOUT ==========
export function logout() {
  // Clear localStorage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCOUNT_KEY);

  // Clear cookies
  document.cookie = "dashboardToken=; path=/; max-age=0; SameSite=Strict";

  // ✅ Set flag to prevent auto-login on next visit
  sessionStorage.setItem('justLoggedOut', 'true');

  // ✅ CRITICAL: Use hard redirect to break any loops
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}

// ========== GET USER INFO ==========
export function getUserInfo() {
  return {
    account: getAccount(),
    role: getRole(),
    isAuthenticated: isAuthenticated(),
  };
}
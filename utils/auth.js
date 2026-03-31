// utils/auth.js
export function requireRole(user, roles) {
  if (!roles.includes(user.role)) throw new Error("Unauthorized");
}
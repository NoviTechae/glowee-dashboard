// app/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "admin" | "salon";
}

const menuItems = {
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Banners", href: "/admin/mobile-banners" },
    { label: "Salons", href: "/admin/salons" },
    { label: "Home Services", href: "/admin/home-services" },
    { label: "Users", href: "/admin/users" },
    { label: "Bookings", href: "/admin/bookings" },
    { label: "Gifts", href: "/admin/gifts" },
    { label: "Feedback", href: "/admin/feedback" },
    { label: "Gift Themes", href: "/admin/gifts/themes" },
    { label: "Notifications", href: "/admin/notifications" },
    { label: "Payments", href: "/admin/payments" },
    { label: "Wallet", href: "/admin/wallet" },
    { label: "Profile", href: "/admin/profile" },
  ],
  salon: [
    { label: "Dashboard", href: "/salon" },
    { label: "Profile", href: "/salon/profile" },
    { label: "Branches", href: "/salon/branches" },
    { label: "Staff", href: "/salon/staff" },
    { label: "Categories", href: "/salon/categories" },
    { label: "Services", href: "/salon/services" },
    { label: "Bookings", href: "/salon/bookings" },
    { label: "Gifts", href: "/salon/gifts" },
    { label: "Reviews", href: "/salon/reviews" },
    { label: "Subscription", href: "/salon/subscription" },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const menu = menuItems[role];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 pt-16">
      <nav className="p-4 space-y-1">
        {menu.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/"); return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span>{item.label}</span>
              </Link>
            );
        })}
      </nav>
    </aside>
  );
}
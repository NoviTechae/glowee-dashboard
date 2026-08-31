// app/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Users,
  Gift,
  Award,
  Star,
  BarChart3,
  MapPin,
  MessageSquareMore,
  User
} from "lucide-react";

import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "admin" | "salon";
}

const adminMenuItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Banners", href: "/admin/mobile-banners" },
  { label: "Salons", href: "/admin/salons" },
  { label: "Home Services", href: "/admin/home-services" },
  { label: "Users", href: "/admin/users" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Gifts", href: "/admin/gifts" },
  { label: "Feedback", href: "/admin/feedback" },
  { label: "Partner Feedback", href: "/admin/partner-feedback" },
  { label: "Gift Themes", href: "/admin/gifts/themes" },
  { label: "Notifications", href: "/admin/notifications" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Wallet", href: "/admin/wallet" },
  { label: "Subscription", href: "/admin/subscriptions" },
  { label: "Profile", href: "/admin/profile" },
];

const salonSections = [
  {
    title: "HOME",
    items: [
      {
        label: "Dashboard",
        href: "/salon",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "MANAGE",
    items: [
      {
        label: "Bookings",
        href: "/salon/bookings",
        icon: CalendarDays,
      },
      {
        label: "Services",
        href: "/salon/services",
        icon: Sparkles,
      },
      {
        label: "Team",
        href: "/salon/staff",
        icon: Users,
      },
    ],
  },
  {
    title: "CUSTOMERS",
    items: [
      {
        label: "Gifts",
        href: "/salon/gifts",
        icon: Gift,
      },
      {
        label: "Loyalty",
        href: "/salon/stamps",
        icon: Award,
      },
      {
        label: "Reviews",
        href: "/salon/reviews",
        icon: Star,
      },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      {
        label: "Analytics",
        href: "/salon/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      {
        label: "Profile",
        href: "/salon/profile",
        icon: User,
      },
      {
        label: "Locations",
        href: "/salon/branches",
        icon: MapPin,
      },
      {
        label: "Feedback",
        href: "/salon/feedback",
        icon: MessageSquareMore,
      },

    ],
  },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  if (role === "admin") {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 pt-16">
        <nav className="p-4 space-y-1">
          {adminMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 pt-16">
      <nav className="px-4 py-5 space-y-6">
        {salonSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold tracking-[0.14em] text-gray-400">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  (item.href !== "/salon" &&
                    pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
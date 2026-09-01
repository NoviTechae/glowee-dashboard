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
  User,
  Image,
  Building2,
  House,
  CreditCard,
  WalletCards,
  Bell,
  Palette,
  BadgeDollarSign,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "admin" | "salon";
}

const adminSections = [
  {
    title: "HOME",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        label: "Bookings",
        href: "/admin/bookings",
        icon: CalendarDays,
      },
      {
        label: "Salons",
        href: "/admin/salons",
        icon: Building2,
      },
      {
        label: "Home Services",
        href: "/admin/home-services",
        icon: House,
      },
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
      },
    ],
  },
  {
    title: "CUSTOMERS",
    items: [
      {
        label: "Gifts",
        href: "/admin/gifts",
        icon: Gift,
      },
      {
        label: "Feedback",
        href: "/admin/feedback",
        icon: Star,
      },
      {
        label: "Partner Feedback",
        href: "/admin/partner-feedback",
        icon: MessageSquareMore,
      },
      {
        label: "Gift Themes",
        href: "/admin/gifts/themes",
        icon: Palette,
      },
    ],
  },
  {
    title: "FINANCE",
    items: [
      {
        label: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
      },
      {
        label: "Wallet",
        href: "/admin/wallet",
        icon: WalletCards,
      },
      {
        label: "Subscription",
        href: "/admin/subscriptions",
        icon: BadgeDollarSign,
      },
    ],
  },
  {
    title: "CONTENT",
    items: [
      {
        label: "Banners",
        href: "/admin/mobile-banners",
        icon: Image,
      },
      {
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      {
        label: "Profile",
        href: "/admin/profile",
        icon: Settings,
      },
    ],
  },
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
    <aside className="fixed left-0 top-0 min-h-screen w-64 border-r border-gray-200 bg-white pt-16">
      <nav className="space-y-6 px-4 py-5">
        {adminSections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.14em] text-gray-400">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                      isActive
                        ? "bg-primary-50 font-medium text-primary-700"
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
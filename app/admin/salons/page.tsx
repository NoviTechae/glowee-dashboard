// app/admin/salons/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Loading } from "@/app/components/ui/Loading";
import { Badge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { salonApi } from "@/lib/api";
import { Salon } from "@/lib/types";
import { formatDate, getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
type SalonRow = Salon & {
  setup_completed?: boolean;
  onboarding_completed?: boolean;
};


export default function SalonsPage() {
  const router = useRouter();
  const [salons, setSalons] = useState<SalonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalons();
  }, []);

  const loadSalons = async () => {
    try {
      setLoading(true);
      const response = await salonApi.getAll();
      setSalons(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load salons");
      setSalons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this salon?")) return;

    try {
      await salonApi.delete(id);
      toast.success("Salon deleted successfully");
      loadSalons();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete salon");
    }
  };

  const isSetupDone = (salon: SalonRow) =>
    salon.setup_completed === true || salon.onboarding_completed === true;

  if (loading) return <Loading size="lg" />;

  const handleToggleStatus = async (salon: SalonRow) => {
  try {
    await api.put(`/dashboard/admin/salons/${salon.id}`, {
      is_active: !salon.is_active,
    });

    loadSalons();
  } catch (error: any) {
    toast.error(error.message || "Failed to update status");
  }
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salons</h1>
          <p className="text-gray-600">
            Add salons, create their accounts, and let owners complete their setup
          </p>
        </div>

        <Button onClick={() => router.push("/admin/salons/create")}>
          Add Salon
        </Button>
      </div>

      {salons.length === 0 ? (
        <Card>
          <EmptyState
            title="No salons yet"
            description="Start by adding a salon and creating its dashboard account"
            action={{
              label: "Add Salon",
              onClick: () => router.push("/admin/salons/create"),
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {salons.map((salon) => {
            const logoSrc = getImageUrl(salon.logo_url);
            const setupDone = isSetupDone(salon);

            return (
              <Card key={salon.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt={salon.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-500">
                          {salon.name?.slice(0, 1)?.toUpperCase() || "S"}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-gray-900">
                        {salon.name}
                      </h3>

                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600">
                          {salon.email || "No email yet"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {salon.phone || "No phone yet"}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant={salon.is_active ? "success" : "gray"}>
                          {salon.is_active ? "Active" : "Inactive"}
                        </Badge>

                        {salon.salon_type && (
                          <Badge variant="primary">
                            {salon.salon_type === "in_salon" && "In-Salon"}
                            {salon.salon_type === "home" && "Home Service"}
                            {salon.salon_type === "both" && "Both"}
                          </Badge>
                        )}

                        <Badge variant={setupDone ? "success" : "gray"}>
                          {setupDone ? "Setup Complete" : "Pending Setup"}
                        </Badge>
                      </div>
                    </div>
                  </div>

<div className="flex shrink-0 gap-2">

  <Button
    variant={salon.is_active ? "secondary" : "primary"}
    size="sm"
    onClick={() => handleToggleStatus(salon)}
  >
    {salon.is_active ? "Disable" : "Approve"}
  </Button>

  <Button
    variant="secondary"
    size="sm"
    onClick={() => router.push(`/admin/salons/${salon.id}`)}
  >
    View
  </Button>

  <Button
    variant="danger"
    size="sm"
    onClick={() => handleDelete(salon.id)}
  >
    Delete
  </Button>

</div>
                </div>

                {salon.about && (
                  <p className="mt-4 text-sm text-gray-600">{salon.about}</p>
                )}

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">
                    Created on {formatDate(salon.created_at)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
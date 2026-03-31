// app/admin/gifts/themes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Loading } from "@/app/components/ui/Loading";
import { Modal } from "@/app/components/ui/Modal";
import { Badge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { giftThemeApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";

interface GiftTheme {
  id: string;
  title: string;
  category: string;
  front_image_url: string;
  back_image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const CATEGORIES = [
  "Welcome Back",
  "Birthday",
  "Anniversary",
  "Wedding",
  "Valentine's Day",
  "Mother's Day",
  "Father's Day",
  "Graduation",
  "Thank You",
  "Congratulations",
  "Get Well",
  "Holiday",
  "Flowers",
  "Other"
];

export default function GiftThemesPage() {
  const [themes, setThemes] = useState<GiftTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<GiftTheme | null>(null);
  const [uploading, setUploading] = useState(false);

  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Birthday",
    is_active: true,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const response = await giftThemeApi.getAll();
      setThemes(response.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load gift themes");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (side === "front") {
        setFrontImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setFrontImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setBackImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setBackImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTheme && (!frontImageFile || !backImageFile)) {
      toast.error("Please upload both front and back card images");
      return;
    }

    setUploading(true);

    try {
      let frontImageUrl = editingTheme?.front_image_url || "";
      let backImageUrl = editingTheme?.back_image_url || "";

      if (frontImageFile) {
        const uploadResponse = await giftThemeApi.upload(frontImageFile);
        frontImageUrl = uploadResponse.url;
      }

      if (backImageFile) {
        const uploadResponse = await giftThemeApi.upload(backImageFile);
        backImageUrl = uploadResponse.url;
      }

      const themeData = {
        title: formData.title,
        category: formData.category,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl,
        is_active: formData.is_active,
      };

      if (editingTheme) {
        await giftThemeApi.update(editingTheme.id, themeData);
        toast.success("Theme updated successfully");
      } else {
        await giftThemeApi.create(themeData);
        toast.success("Theme created successfully");
      }

      setIsModalOpen(false);
      setEditingTheme(null);
      resetForm();
      loadThemes();
    } catch (error: any) {
      toast.error(error.message || "Failed to save theme");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (theme: GiftTheme) => {
    setEditingTheme(theme);
    setFormData({
      title: theme.title,
      category: theme.category,
      is_active: theme.is_active,
    });
    setFrontImagePreview(getImageUrl(theme.front_image_url));
    setBackImagePreview(getImageUrl(theme.back_image_url));
    setFrontImageFile(null);
    setBackImageFile(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (theme: GiftTheme) => {
    try {
      await giftThemeApi.update(theme.id, { is_active: !theme.is_active });
      toast.success("Theme status updated");
      loadThemes();
    } catch (error: any) {
      toast.error(error.message || "Failed to update theme");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this theme?")) return;
    try {
      await giftThemeApi.delete(id);
      toast.success("Theme deleted successfully");
      loadThemes();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete theme");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", category: "Birthday", is_active: true });
    setFrontImageFile(null);
    setBackImageFile(null);
    setFrontImagePreview(null);
    setBackImagePreview(null);
  };

  const handleAddNew = () => {
    setEditingTheme(null);
    resetForm();
    setIsModalOpen(true);
  };

  const filteredThemes =
    selectedCategory === "All"
      ? themes
      : themes.filter((t) => t.category === selectedCategory);

  const themesByCategory = themes.reduce((acc, theme) => {
    acc[theme.category] = (acc[theme.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <Loading size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Card Themes</h1>
          <p className="text-gray-600">Manage gift card designs with front and back images</p>
        </div>
        <Button onClick={handleAddNew}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Theme
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Themes</p>
            <p className="text-3xl font-bold text-gray-900">{themes.length}</p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {themes.filter((t) => t.is_active).length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Inactive</p>
            <p className="text-3xl font-bold text-gray-400">
              {themes.filter((t) => !t.is_active).length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-3xl font-bold text-primary-600">
              {Object.keys(themesByCategory).length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              selectedCategory === "All"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({themes.length})
          </button>

          {CATEGORIES.map((category) => {
            const count = themesByCategory[category] || 0;
            if (count === 0) return null;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === category
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </Card>

      {filteredThemes.length === 0 ? (
        <Card>
          <EmptyState
            title={selectedCategory === "All" ? "No gift themes yet" : `No ${selectedCategory} themes`}
            description={
              selectedCategory === "All"
                ? "Create your first gift theme to get started"
                : `Create your first ${selectedCategory} theme`
            }
            action={{ label: "Add Theme", onClick: handleAddNew }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThemes.map((theme) => (
            <Card key={theme.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Front</p>
                    <img
                      src={getImageUrl(theme.front_image_url) || undefined}
                      alt={`${theme.title} - Front`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Back</p>
                    <img
                      src={getImageUrl(theme.back_image_url) || undefined}
                      alt={`${theme.title} - Back`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{theme.title}</h3>
                    <Badge variant={theme.is_active ? "success" : "gray"}>
                      {theme.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="primary">{theme.category}</Badge>
                    <span className="text-xs text-gray-500">Order: {theme.sort_order}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(theme)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant={theme.is_active ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handleToggleActive(theme)}
                    className="flex-1"
                  >
                    {theme.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(theme.id)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTheme(null);
          resetForm();
        }}
        title={editingTheme ? "Edit Gift Card Theme" : "Add New Gift Card Theme"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Theme Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Birthday Celebration"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Front Card Image {!editingTheme && <span className="text-red-500">*</span>}
            </label>
            {frontImagePreview && (
              <div className="mb-3">
                <img
                  src={frontImagePreview || undefined}
                  alt="Front Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleImageChange(e, "front")}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload JPG, PNG, or WEBP (max 6MB)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Back Card Image {!editingTheme && <span className="text-red-500">*</span>}
            </label>
            {backImagePreview && (
              <div className="mb-3">
                <img
                  src={backImagePreview || undefined}
                  alt="Back Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleImageChange(e, "back")}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-500 mt-1">Upload JPG, PNG, or WEBP (max 6MB)</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active (visible to users)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" isLoading={uploading}>
              {uploading ? "Uploading..." : editingTheme ? "Update Theme" : "Create Theme"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTheme(null);
                resetForm();
              }}
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
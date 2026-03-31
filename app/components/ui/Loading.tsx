// app/components/ui/Loading.tsx
export function Loading({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} border-primary-600 border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}
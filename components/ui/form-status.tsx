import { cn } from "@/lib/utils";

export function FormStatusBanner({
  status,
  message,
}: {
  status: "success" | "error";
  message: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "mb-8 rounded-md border px-4 py-3 font-body text-sm text-hull",
        status === "success"
          ? "border-patina/30 bg-[rgb(110_139_123_/_0.10)]"
          : "border-rust/30 bg-[rgb(155_44_44_/_0.08)]",
      )}
    >
      {message}
    </div>
  );
}

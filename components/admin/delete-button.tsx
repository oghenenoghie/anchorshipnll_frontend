"use client";

export function DeleteButton({ confirmMessage }: { confirmMessage: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
      className="font-body text-xs font-medium text-rust hover:underline"
    >
      Delete
    </button>
  );
}

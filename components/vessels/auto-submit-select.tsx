"use client";

import type { SelectHTMLAttributes } from "react";

// Submits its form as soon as the choice changes; the form keeps a submit
// button inside <noscript> for browsers without JavaScript.
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

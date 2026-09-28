"use client";

import type { FormHTMLAttributes } from "react";

// A GET form that leaves empty fields out of the URL (?q=&minYear= …), so
// shared search links stay short. Without JavaScript it submits normally.
export function CleanGetForm(props: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      {...props}
      method="get"
      onSubmit={(e) => {
        for (const el of Array.from(e.currentTarget.elements)) {
          if ((el instanceof HTMLInputElement || el instanceof HTMLSelectElement) && el.name && el.value === "") {
            el.disabled = true;
          }
        }
      }}
    />
  );
}

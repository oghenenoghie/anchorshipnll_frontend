"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

// Fade-up on scroll, per the design system: 14px, 350ms, ease-out, once.
// Always the same element on server and client (branching on
// useReducedMotion() here would hydrate the server's hidden state and leave
// the content invisible); reduced motion and no-JS visitors are handled by
// the [data-fade-in] rules in globals.css and the layout's <noscript>.
// Use it only below the fold.
export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      data-fade-in=""
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

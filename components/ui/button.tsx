import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold font-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blueprint focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-signal text-snow hover:bg-[#B3551F] focus-visible:ring-offset-paper",
        secondary:
          "bg-transparent text-hull border border-border-strong hover:bg-steel/5 focus-visible:ring-offset-paper",
        onDark:
          "bg-transparent text-paper border border-white/20 hover:bg-white/10 focus-visible:ring-offset-hull",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

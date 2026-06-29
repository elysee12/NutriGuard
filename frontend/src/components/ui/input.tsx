import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, iconPosition = "left", ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative w-full">
          {iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-background py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 hover:border-primary/30",
              iconPosition === "left" ? "pl-10 pr-3" : "pl-3 pr-10",
              className,
            )}
            ref={ref}
            {...props}
          />
          {iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 hover:border-primary/30",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

import * as React from "react";
import { FaCalendar } from "react-icons/fa";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, iconPosition = "left", ...props }, ref) => {
    // Special handling for date inputs to show calendar icon
    if (type === "date") {
      return (
        <div className="relative w-full">
          {/* Left icon (if provided) */}
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
              {icon}
            </div>
          )}
          
          {/* Date input */}
          <input
            type="date"
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-background py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 hover:border-primary/30 cursor-pointer relative z-20",
              icon && iconPosition === "left" ? "pl-10" : "pl-3",
              "pr-10", // Always leave space for calendar icon on the right
              // Hide the native date picker icon but keep it functional
              "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-30",
              className,
            )}
            ref={ref}
            {...props}
          />
          
          {/* Custom Calendar icon on the right (always shown for date inputs) */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10">
            <FaCalendar className="h-4 w-4" />
          </div>
        </div>
      );
    }

    // Regular inputs with optional icon
    if (icon) {
      return (
        <div className="relative w-full">
          {iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-background py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 hover:border-primary/30 relative z-20",
              iconPosition === "left" ? "pl-10 pr-3" : "pl-3 pr-10",
              className,
            )}
            ref={ref}
            {...props}
          />
          {iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
              {icon}
            </div>
          )}
        </div>
      );
    }

    // Input without icon
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

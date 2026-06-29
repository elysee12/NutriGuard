import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectWithIconProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

const SelectWithIcon = React.forwardRef<HTMLSelectElement, SelectWithIconProps>(
  ({ className, icon, children, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
            {icon}
          </div>
          <select
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all pl-10 pr-10",
              className,
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      );
    }

    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all pr-10",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);
SelectWithIcon.displayName = "SelectWithIcon";

export { SelectWithIcon };

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({ title, value, icon, change, changeType = "neutral" }: StatCardProps) {
  return (
    <div className="stat-card p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 overflow-hidden">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground mt-1 truncate">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm mt-2 font-medium ${
              changeType === "positive" ? "text-success" :
              changeType === "negative" ? "text-danger" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary ml-2 shrink-0">
          <div className="scale-75 sm:scale-100">{icon}</div>
        </div>
      </div>
    </div>
  );
}

interface RiskBadgeProps {
  level: "low" | "moderate" | "high";
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const config = {
    low: { label: "Low Risk", className: "risk-low" },
    moderate: { label: "Moderate", className: "risk-moderate" },
    high: { label: "High Risk", className: "risk-high" },
  };
  const c = config[level];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.className}`}>
      {c.label}
    </span>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}

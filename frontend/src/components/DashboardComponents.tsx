import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({ title, value, icon, change, changeType = "neutral" }: StatCardProps) {
  const iconColorClass = 
    changeType === "positive" ? "icon-container-success" :
    changeType === "negative" ? "icon-container-danger" : "icon-container-primary";

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1 overflow-hidden space-y-3">
          <p className="metric-label truncate">{title}</p>
          <p className="metric-value truncate">{value}</p>
          {change && (
            <div className="flex items-center gap-2">
              {changeType === "positive" && (
                <div className="flex items-center gap-1 text-success">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-sm font-bold">{change}</span>
                </div>
              )}
              {changeType === "negative" && (
                <div className="flex items-center gap-1 text-danger">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span className="text-sm font-bold">{change}</span>
                </div>
              )}
              {changeType === "neutral" && (
                <p className="text-sm font-semibold text-muted-foreground">{change}</p>
              )}
            </div>
          )}
        </div>
        <div className={`${iconColorClass} group-hover:scale-110 group-hover:bg-opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface RiskBadgeProps {
  level: "low" | "moderate" | "high";
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const { t } = useTranslation();
  const config = {
    low: { label: t('dashboard.low_risk'), className: "risk-low" },
    moderate: { label: t('dashboard.moderate_risk'), className: "risk-moderate" },
    high: { label: t('dashboard.high_risk'), className: "risk-high" },
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
    <div className="page-header">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="greeting-header">GOOD MORNING</div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3 items-start">{actions}</div>}
      </div>
    </div>
  );
}

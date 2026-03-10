import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "warning";
};

const toneMap = {
  default: "bg-slate-100 text-slate-600",
  positive: "bg-emerald-100 text-emerald-700",
  warning: "bg-rose-100 text-rose-700",
};

export function KpiCard({ title, value, subtitle, icon: Icon, tone = "default" }: KpiCardProps) {
  return (
    <Card className="border-slate-200/70 bg-white/90 shadow-sm backdrop-blur">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {subtitle ? <p className="text-xs text-slate-600">{subtitle}</p> : null}
        </div>
        <span className={`rounded-xl p-2.5 ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}



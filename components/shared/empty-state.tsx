import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-slate-300 bg-slate-50/80">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <span className="rounded-full bg-slate-200 p-3 text-slate-700">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="max-w-md text-sm text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}

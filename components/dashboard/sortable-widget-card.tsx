"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import { Eye, GripVertical, Maximize2, Minimize2, Settings2, Trash2 } from "lucide-react";
import type { DashboardWidgetLayout } from "@/lib/types/app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SortableWidgetCardProps = {
  widget: DashboardWidgetLayout;
  children: ReactNode;
  onRemove: (id: string) => void;
  onResize: (id: string) => void;
  onDrilldown: (widget: DashboardWidgetLayout) => void;
  onEdit: (widget: DashboardWidgetLayout) => void;
};

export function SortableWidgetCard({
  widget,
  children,
  onRemove,
  onResize,
  onDrilldown,
  onEdit,
}: SortableWidgetCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-slate-200 bg-white shadow-sm ${isDragging ? "opacity-60" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-slate-900">{widget.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onResize(widget.id)}
              title="Redimensionar"
            >
              {widget.colSpan > 1 ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(widget)}
              title="Editar widget"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDrilldown(widget)}
              title="Abrir drilldown"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600"
              onClick={() => onRemove(widget.id)}
              title="Remover widget"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-grab active:cursor-grabbing"
              title="Reordenar"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

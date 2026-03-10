"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="border-red-200 bg-red-50/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          Ocorreu um erro ao carregar esta página
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-700/90">
          {error.message || "Tente novamente em instantes."}
        </p>
        <Button variant="destructive" onClick={reset}>
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}

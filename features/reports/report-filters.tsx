"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Loader2 } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants/options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Option = {
  id: string;
  name: string;
};

type ReportFiltersProps = {
  startDate: string;
  endDate: string;
  productId?: string;
  categoryId?: string;
  paymentMethod?: string;
  userId?: string;
  products: Option[];
  categories: Option[];
  users: { id: string; full_name: string | null }[];
};

export function ReportFilters({
  startDate,
  endDate,
  productId,
  categoryId,
  paymentMethod,
  userId,
  products,
  categories,
  users,
}: ReportFiltersProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedProductLabel = products.find((product) => product.id === productId)?.name ?? "";
  const selectedCategoryLabel = categories.find((category) => category.id === categoryId)?.name ?? "";
  const selectedUserLabel = users.find((user) => user.id === userId)?.full_name ?? "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "todos") params.delete(key);
    else params.set(key, value);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
      <Input type="date" value={startDate} onChange={(e) => updateParam("inicio", e.target.value)} />
      <Input type="date" value={endDate} onChange={(e) => updateParam("fim", e.target.value)} />

      <Select
        value={productId ?? "todos"}
        onValueChange={(value) => updateParam("produto", value ?? "todos")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Produto">{selectedProductLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os produtos</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={categoryId ?? "todos"}
        onValueChange={(value) => updateParam("categoria", value ?? "todos")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Categoria">{selectedCategoryLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={paymentMethod ?? "todos"}
        onValueChange={(value) => updateParam("pagamento", value ?? "todos")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os pagamentos</SelectItem>
          {PAYMENT_METHODS.map((method) => (
            <SelectItem key={method} value={method}>
              {method}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={userId ?? "todos"}
        onValueChange={(value) => updateParam("usuario", value ?? "todos")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Usuario">{selectedUserLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os usuarios</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.full_name ?? "Sem nome"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="md:col-span-3 xl:col-span-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            Filtros aplicados automaticamente
          </Button>
          <Button variant="ghost" onClick={clearAll}>
            Limpar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}

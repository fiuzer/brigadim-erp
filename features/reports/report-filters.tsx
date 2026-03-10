"use client";

import { useMemo, useState, useTransition } from "react";
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
  expenseCategoryId?: string;
  paymentMethod?: string;
  userId?: string;
  products: Option[];
  categories: Option[];
  expenseCategories: Option[];
  users: { id: string; full_name: string | null }[];
};

export function ReportFilters({
  startDate,
  endDate,
  productId,
  categoryId,
  expenseCategoryId,
  paymentMethod,
  userId,
  products,
  categories,
  expenseCategories,
  users,
}: ReportFiltersProps) {
  const [isPending, startTransition] = useTransition();
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [localProductId, setLocalProductId] = useState(productId ?? "todos");
  const [localCategoryId, setLocalCategoryId] = useState(categoryId ?? "todos");
  const [localExpenseCategoryId, setLocalExpenseCategoryId] = useState(expenseCategoryId ?? "todos");
  const [localPaymentMethod, setLocalPaymentMethod] = useState(paymentMethod ?? "todos");
  const [localUserId, setLocalUserId] = useState(userId ?? "todos");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedProductLabel = products.find((product) => product.id === localProductId)?.name ?? "";
  const selectedCategoryLabel = categories.find((category) => category.id === localCategoryId)?.name ?? "";
  const selectedExpenseCategoryLabel =
    expenseCategories.find((category) => category.id === localExpenseCategoryId)?.name ?? "";
  const selectedUserLabel = users.find((user) => user.id === localUserId)?.full_name ?? "";

  const hasActiveFilters = useMemo(() => {
    const urlStart = searchParams.get("inicio") ?? "";
    const urlEnd = searchParams.get("fim") ?? "";
    return (
      urlStart !== localStartDate ||
      urlEnd !== localEndDate ||
      (searchParams.get("produto") ?? "todos") !== localProductId ||
      (searchParams.get("categoria") ?? "todos") !== localCategoryId ||
      (searchParams.get("categoriaDespesa") ?? "todos") !== localExpenseCategoryId ||
      (searchParams.get("pagamento") ?? "todos") !== localPaymentMethod ||
      (searchParams.get("usuario") ?? "todos") !== localUserId
    );
  }, [
    localStartDate,
    localEndDate,
    localProductId,
    localCategoryId,
    localExpenseCategoryId,
    localPaymentMethod,
    localUserId,
    searchParams,
  ]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (localStartDate) params.set("inicio", localStartDate);
    if (localEndDate) params.set("fim", localEndDate);
    if (localProductId !== "todos") params.set("produto", localProductId);
    if (localCategoryId !== "todos") params.set("categoria", localCategoryId);
    if (localExpenseCategoryId !== "todos") params.set("categoriaDespesa", localExpenseCategoryId);
    if (localPaymentMethod !== "todos") params.set("pagamento", localPaymentMethod);
    if (localUserId !== "todos") params.set("usuario", localUserId);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearAll = () => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setLocalProductId("todos");
    setLocalCategoryId("todos");
    setLocalExpenseCategoryId("todos");
    setLocalPaymentMethod("todos");
    setLocalUserId("todos");
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3 xl:grid-cols-7">
      <Input type="date" value={localStartDate} onChange={(e) => setLocalStartDate(e.target.value)} />
      <Input type="date" value={localEndDate} onChange={(e) => setLocalEndDate(e.target.value)} />

      <Select
        value={localProductId}
        onValueChange={(value) => setLocalProductId(value ?? "todos")}
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
        value={localCategoryId}
        onValueChange={(value) => setLocalCategoryId(value ?? "todos")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Categoria de produto">{selectedCategoryLabel}</SelectValue>
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
        value={localExpenseCategoryId}
        onValueChange={(value) => setLocalExpenseCategoryId(value ?? "todos")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Categoria de despesa">{selectedExpenseCategoryLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as despesas</SelectItem>
          {expenseCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={localPaymentMethod}
        onValueChange={(value) => setLocalPaymentMethod(value ?? "todos")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Forma de pagamento" />
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
        value={localUserId}
        onValueChange={(value) => setLocalUserId(value ?? "todos")}
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

      <div className="md:col-span-3 xl:col-span-7">
        <div className="flex flex-wrap gap-2">
          <Button onClick={applyFilters} className="gap-2" disabled={isPending || !hasActiveFilters}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            Aplicar filtros
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={isPending}>
            Limpar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}

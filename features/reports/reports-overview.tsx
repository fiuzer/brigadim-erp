"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyBRL, formatDateBR, formatDateTimeBR } from "@/lib/utils/format";

type ReportData = {
  sales: {
    id: string;
    sold_at: string;
    payment_method: string;
    total_amount: number;
    profile: { full_name: string | null } | null;
    sale_items: {
      product_id: string;
      product: { name: string } | null;
    }[];
  }[];
  expenses: {
    id: string;
    expense_date: string;
    description: string;
    amount: number;
    category: { name: string } | null;
    profile: { full_name: string | null } | null;
  }[];
  salesByPayment: { name: string; value: number }[];
  salesByProduct: {
    id: string;
    name: string;
    qty: number;
    revenue: number;
    grossProfit: number;
  }[];
  expensesByCategory: { name: string; value: number }[];
};

export function ReportsOverview({ report }: { report: ReportData }) {
  const [paymentDrilldown, setPaymentDrilldown] = useState<string | null>(null);
  const [productDrilldown, setProductDrilldown] = useState<string | null>(null);
  const [expenseCategoryDrilldown, setExpenseCategoryDrilldown] = useState<string | null>(null);

  const filteredSales = useMemo(() => {
    return report.sales.filter((sale) => {
      const matchesPayment = !paymentDrilldown || sale.payment_method === paymentDrilldown;
      const matchesProduct =
        !productDrilldown ||
        sale.sale_items.some((item) => item.product?.name === productDrilldown);
      return matchesPayment && matchesProduct;
    });
  }, [report.sales, paymentDrilldown, productDrilldown]);

  const filteredExpenses = useMemo(() => {
    return report.expenses.filter((expense) => {
      return !expenseCategoryDrilldown || expense.category?.name === expenseCategoryDrilldown;
    });
  }, [report.expenses, expenseCategoryDrilldown]);

  const clearDrilldowns = () => {
    setPaymentDrilldown(null);
    setProductDrilldown(null);
    setExpenseCategoryDrilldown(null);
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white">
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          {paymentDrilldown ? (
            <Badge className="bg-cyan-100 text-cyan-700">Pagamento: {paymentDrilldown}</Badge>
          ) : null}
          {productDrilldown ? (
            <Badge className="bg-rose-100 text-rose-700">Produto: {productDrilldown}</Badge>
          ) : null}
          {expenseCategoryDrilldown ? (
            <Badge className="bg-rose-100 text-rose-700">
              Despesa: {expenseCategoryDrilldown}
            </Badge>
          ) : null}
          {paymentDrilldown || productDrilldown || expenseCategoryDrilldown ? (
            <Button variant="ghost" size="sm" className="gap-1" onClick={clearDrilldowns}>
              <X className="h-3.5 w-3.5" />
              Limpar drilldowns
            </Button>
          ) : (
            <p className="text-sm text-slate-500">
              Clique nos graficos para abrir drilldowns interativos.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Vendas por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.salesByPayment}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  fill="#B96A75"
                  onClick={(item) => {
                    const name = (item as { name?: string } | undefined)?.name;
                    if (!name) return;
                    setPaymentDrilldown((old) => (old === name ? null : name));
                  }}
                />
                <Tooltip formatter={(value) => formatCurrencyBRL(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.salesByProduct.slice(0, 10)} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `${value} un.`} />
                <Bar
                  dataKey="qty"
                  fill="#06b6d4"
                  radius={[6, 6, 0, 0]}
                  onClick={(item) => {
                    const name = (item as { name?: string } | undefined)?.name;
                    if (!name) return;
                    setProductDrilldown((old) => (old === name ? null : name));
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.expensesByCategory} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrencyBRL(Number(value))} />
                <Bar
                  dataKey="value"
                  fill="#B96A75"
                  radius={[6, 6, 0, 0]}
                  onClick={(item) => {
                    const name = (item as { name?: string } | undefined)?.name;
                    if (!name) return;
                    setExpenseCategoryDrilldown((old) => (old === name ? null : name));
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">
            Relatorio de Vendas ({filteredSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Pagamento</th>
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{formatDateTimeBR(sale.sold_at)}</td>
                  <td className="px-3 py-2">{sale.id.slice(0, 8)}</td>
                  <td className="px-3 py-2">{sale.payment_method}</td>
                  <td className="px-3 py-2">{sale.profile?.full_name ?? "-"}</td>
                  <td className="px-3 py-2">{formatCurrencyBRL(sale.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">
            Relatorio de Despesas ({filteredExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Descricao</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{formatDateBR(expense.expense_date)}</td>
                  <td className="px-3 py-2">{expense.description}</td>
                  <td className="px-3 py-2">{expense.category?.name ?? "Sem categoria"}</td>
                  <td className="px-3 py-2">{expense.profile?.full_name ?? "-"}</td>
                  <td className="px-3 py-2">{formatCurrencyBRL(expense.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}


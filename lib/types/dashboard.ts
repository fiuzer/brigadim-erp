import type { DashboardWidgetLayout, DashboardWidgetType } from "@/lib/types/app";

export type DashboardFilterState = {
  startDate: string;
  endDate: string;
  paymentMethod: string;
  productId: string;
  categoryName: string;
  operatorId: string;
};

export type DashboardDrilldownContext = {
  widgetType: DashboardWidgetType;
  label?: string;
};

export type DashboardAnalytics = {
  userId: string;
  savedLayout: DashboardWidgetLayout[] | null;
  savedFilters: DashboardFilterState | null;
  appliedFilters: DashboardFilterState;
  filterOptions: {
    paymentMethods: string[];
    products: { id: string; name: string }[];
    categories: string[];
    operators: { id: string; name: string }[];
  };
  metrics: {
    revenueToday: number;
    revenuePeriod: number;
    grossProfit: number;
    netProfit: number;
    averageTicket: number;
    salesCount: number;
    stockValue: number;
    lowStockCount: number;
    productsWithoutMovement: number;
  };
  paymentBreakdown: { name: string; value: number }[];
  topProducts: { name: string; value: number }[];
  mostProfitableProducts: { name: string; grossProfit: number; margin: number }[];
  expensesByCategory: { name: string; value: number }[];
  lowStockProducts: {
    product_id: string;
    product_name: string;
    stock_quantity: number;
    min_stock: number;
    category_name: string | null;
  }[];
  salesDetailed: {
    id: string;
    sold_at: string;
    payment_method: string;
    total_amount: number;
    user_name: string | null;
  }[];
  expensesDetailed: {
    id: string;
    expense_date: string;
    description: string;
    amount: number;
    category_name: string | null;
  }[];
};

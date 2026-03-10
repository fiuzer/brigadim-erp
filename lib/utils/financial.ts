type TicketInput = {
  salesCount: number;
  revenue: number;
};

export const calcGrossProfit = (revenue: number, cogs: number) => revenue - cogs;

export const calcNetProfit = (grossProfit: number, expenses: number) =>
  grossProfit - expenses;

export const calcAverageTicket = ({ revenue, salesCount }: TicketInput) =>
  salesCount > 0 ? revenue / salesCount : 0;

export const calcMarginPercent = (profit: number, revenue: number) =>
  revenue > 0 ? (profit / revenue) * 100 : 0;

export const calcStockValue = (
  items: { production_cost: number; stock_quantity: number }[],
) =>
  items.reduce(
    (total, item) => total + Number(item.production_cost || 0) * Number(item.stock_quantity || 0),
    0,
  );

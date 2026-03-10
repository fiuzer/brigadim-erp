import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatCurrencyBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

export const formatDateBR = (value: string | Date, dateFormat = "dd/MM/yyyy") => {
  if (!value) return "-";
  const date = value instanceof Date ? value : parseISO(value);
  return format(date, dateFormat, { locale: ptBR });
};

export const formatDateTimeBR = (value: string | Date) =>
  formatDateBR(value, "dd/MM/yyyy HH:mm");

export const toNumber = (value: string | number) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

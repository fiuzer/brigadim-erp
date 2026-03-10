const APP_TIME_ZONE = "America/Sao_Paulo";

type DateLike = string | Date;

function toValidDate(value: DateLike) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function partsInTimeZone(date: Date, timeZone = APP_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const map = new Map(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: map.get("year") ?? "0000",
    month: map.get("month") ?? "01",
    day: map.get("day") ?? "01",
    hour: map.get("hour") ?? "00",
    minute: map.get("minute") ?? "00",
  };
}

export function getDateInputValueInTimeZone(date = new Date(), timeZone = APP_TIME_ZONE) {
  const parts = partsInTimeZone(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getDateTimeInputValueInTimeZone(date = new Date(), timeZone = APP_TIME_ZONE) {
  const parts = partsInTimeZone(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function getYearMonthValueInTimeZone(date = new Date(), timeZone = APP_TIME_ZONE) {
  const parts = partsInTimeZone(date, timeZone);
  return `${parts.year}-${parts.month}`;
}

export function getDateValueInTimeZone(value: DateLike, timeZone = APP_TIME_ZONE) {
  const date = toValidDate(value);
  if (!date) return "";
  return getDateInputValueInTimeZone(date, timeZone);
}


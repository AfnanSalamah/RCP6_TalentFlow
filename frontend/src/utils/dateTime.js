export const browserTimeZone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLocalDateTime(value, options = {}) {
  const date = parseDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: options.dateStyle || "medium",
    timeStyle: options.timeStyle || "short",
    timeZone: browserTimeZone,
  }).format(date);
}

export function formatLocalDate(value, options = {}) {
  const date = parseDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: options.dateStyle || "medium",
    timeZone: browserTimeZone,
  }).format(date);
}

export function formatLocalTime(value, options = {}) {
  const date = parseDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: browserTimeZone,
    ...options,
  }).format(date);
}

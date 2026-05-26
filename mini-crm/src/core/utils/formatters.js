const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatCurrency(value = 0) {
  return currencyFormatter.format(Number(value) || 0);
}

export function formatDateTime(value) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid date" : dateFormatter.format(date);
}

export function formatRelativeTime(value, now = new Date()) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const elapsedMs = now.getTime() - date.getTime();
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.round(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

export function formatPhone(value = "") {
  return value.trim() || "No phone";
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function actionHref(kind, value = "") {
  const cleanValue = value.trim();
  if (!cleanValue) {
    return "#";
  }

  if (kind === "email") {
    return `mailto:${cleanValue}`;
  }

  if (kind === "sms") {
    return `sms:${cleanValue}`;
  }

  return `tel:${cleanValue}`;
}

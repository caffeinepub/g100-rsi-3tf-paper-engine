// Formatting utilities
export function formatCurrency(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}

export function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '0.00%';
  return `${value.toFixed(2)}%`;
}

export function formatTimestamp(timestamp: number | string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return 'N/A';
  }
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return 'N/A';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatNumber(value: number | undefined, decimals: number = 2): string {
  if (value === undefined || !Number.isFinite(value)) return '0.00';
  return value.toFixed(decimals);
}

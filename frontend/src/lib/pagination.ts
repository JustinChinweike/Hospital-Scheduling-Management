export type PageItem = number | 'ellipsis';

export function buildPageItems(current: number, total: number, window = 2, maxLength = 11): PageItem[] {
  if (total <= maxLength) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  const start = Math.max(2, current - window);
  const end = Math.min(total - 1, current + window);
  for (let p = start; p <= end; p++) pages.add(p);
  // Ensure we still have at least first few pages if current is far
  if (current - window > 3) {
    pages.add(current - window - 1); // anchor for ellipsis logic
  } else {
    for (let p = 2; p < Math.min(2 + window, total); p++) pages.add(p);
  }
  if (current + window < total - 2) {
    pages.add(current + window + 1);
  } else {
    for (let p = Math.max(total - 1 - window, 2); p < total; p++) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: PageItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1) {
      const gap = sorted[i + 1] - sorted[i];
      if (gap === 2) {
        result.push(sorted[i] + 1);
      } else if (gap > 2) {
        result.push('ellipsis');
      }
    }
  }
  return result;
}

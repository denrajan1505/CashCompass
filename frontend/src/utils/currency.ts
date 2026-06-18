export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$',
  CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'Fr', HKD: 'HK$',
  CNY: '¥', SAR: '﷼', BRL: 'R$', ZAR: 'R', THB: '฿',
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency
}

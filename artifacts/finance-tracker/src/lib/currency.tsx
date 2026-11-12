import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
];

const STORAGE_KEY = "aero-finance-currency";

interface CurrencyContextValue {
  currency: string;
  setCurrency: (code: string) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "INR",
  setCurrency: () => {},
  formatAmount: (n) => `₹${(Number(n) || 0).toFixed(2)}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? "INR"
  );

  function setCurrency(code: string) {
    localStorage.setItem(STORAGE_KEY, code);
    setCurrencyState(code);
  }

  function formatAmount(amount: number): string {
    const num = typeof amount === "number" && !isNaN(amount) ? amount : (Number(amount) || 0);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

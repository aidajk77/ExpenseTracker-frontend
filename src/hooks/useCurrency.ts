import CurrencyContext from "@/context/CurrencyContext";
import { useContext } from "react";

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
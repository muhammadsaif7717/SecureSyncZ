import { useEffect } from "react";

// Overloads
export function useCLG(value: unknown): void;
export function useCLG(label: string, value: unknown): void;

// Implementation
export function useCLG(arg1: unknown, arg2?: unknown): void {
  const label = typeof arg1 === "string" && arg2 !== undefined ? arg1 : "Debug";
  const value = arg2 !== undefined ? arg2 : arg1;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Intentionally left blank to remove console logs
    }
  }, [label, value]);
}

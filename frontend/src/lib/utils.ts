import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const bigNumberToBigInt = (value: BigNumber) => {
  return BigInt(value.toFixed(0))
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidEthereumAddress(address: string) {
  return /^0x[a-fA-F0-9]{42}$/.test(address);
}

export function isValidTwitterUrl(url: string) {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "twitter.com" ||
        parsed.hostname === "x.com" ||
        parsed.hostname === "www.twitter.com" ||
        parsed.hostname === "www.x.com") &&
      parsed.pathname.length > 1
    );
  } catch {
    return false;
  }
}

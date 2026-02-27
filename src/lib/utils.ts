import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { isAddress } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function normalizeEthereumAddress(address: string): string {
  let normalized = address.trim();
  if (!normalized.startsWith("0x")) {
    normalized = `0x${normalized}`;
  }
  return normalized;
}

export function isValidEthereumAddress(address: string) {
  try {
    const normalized = normalizeEthereumAddress(address);
    return isAddress(normalized);
  } catch {
    return false;
  }
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

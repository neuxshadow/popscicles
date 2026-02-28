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

export function isValidTwitterHandle(handle: string) {
  // Twitter handles are 1-15 characters, alphanumeric + underscore
  const regex = /^@?(\w{1,15})$/;
  return regex.test(handle);
}

export function isValidTwitterUrl(url: string) {
  try {
    const parsed = new URL(url);
    const isCorrectHost = (
      parsed.hostname === "twitter.com" ||
      parsed.hostname === "x.com" ||
      parsed.hostname === "www.twitter.com" ||
      parsed.hostname === "www.x.com"
    );
    
    // Path should be /<username>/status/<id>
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const hasStatus = pathParts[1] === 'status' && /^\d+$/.test(pathParts[2]);
    
    return isCorrectHost && hasStatus;
  } catch {
    return false;
  }
}
export function csvEscape(value: any): string {
  if (value === null || value === undefined) return "";
  let str = String(value).trim();

  // CSV Injection Protection: prefix with ' if starts with special characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

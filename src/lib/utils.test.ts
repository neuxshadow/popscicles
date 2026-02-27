import { describe, it, expect } from "vitest";
import { isValidEthereumAddress, normalizeEthereumAddress } from "./utils";

describe("Ethereum Address Validation", () => {
  it("should validate valid lowercase addresses", () => {
    expect(isValidEthereumAddress("0x71c7656ec7ab88b098defb751b7401b5f6d8976f")).toBe(true);
  });

  it("should validate valid checksummed addresses", () => {
    expect(isValidEthereumAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F")).toBe(true);
  });

  it("should normalize addresses missing 0x prefix", () => {
    const address = "71c7656ec7ab88b098defb751b7401b5f6d8976f";
    expect(normalizeEthereumAddress(address)).toBe(`0x${address}`);
    expect(isValidEthereumAddress(address)).toBe(true);
  });

  it("should trim whitespace", () => {
    const address = "  0x71c7656ec7ab88b098defb751b7401b5f6d8976f  ";
    expect(normalizeEthereumAddress(address)).toBe("0x71c7656ec7ab88b098defb751b7401b5f6d8976f");
    expect(isValidEthereumAddress(address)).toBe(true);
  });

  it("should reject invalid lengths", () => {
    expect(isValidEthereumAddress("0x71c7656ec7ab88b098defb751b7401b5f6d8976")).toBe(false); // 40 chars
    expect(isValidEthereumAddress("0x71c7656ec7ab88b098defb751b7401b5f6d8976fff")).toBe(false); // 44 chars
  });

  it("should reject non-hex characters", () => {
    expect(isValidEthereumAddress("0x71c7656ec7ab88b098defb751b7401b5f6d8976g")).toBe(false);
  });

  it("should reject completely invalid strings", () => {
    expect(isValidEthereumAddress("not-an-address")).toBe(false);
    expect(isValidEthereumAddress("")).toBe(false);
  });
});

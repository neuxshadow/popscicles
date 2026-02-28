import { describe, it, expect } from "vitest";
import { 
  isValidEthereumAddress, 
  normalizeEthereumAddress, 
  isValidTwitterHandle, 
  isValidTwitterUrl 
} from "./utils";

describe("Validation Utilities", () => {
  describe("Ethereum Address", () => {
    it("should validate valid addresses", () => {
      expect(isValidEthereumAddress("0x71c7656ec7ab88b098defb751b7401b5f6d8976f")).toBe(true);
      expect(isValidEthereumAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F")).toBe(true);
    });

    it("should normalize and validate addresses", () => {
      expect(isValidEthereumAddress("71c7656ec7ab88b098defb751b7401b5f6d8976f")).toBe(true);
      expect(normalizeEthereumAddress("  0x71c765...  ").trim()).toBe("0x71c765..."); // normalize only trims and adds 0x
    });

    it("should reject invalid addresses", () => {
      expect(isValidEthereumAddress("0x123")).toBe(false);
      expect(isValidEthereumAddress("0xG1c7656ec7ab88b098defb751b7401b5f6d8976f")).toBe(false);
    });
  });

  describe("Twitter Handle", () => {
    it("should validate valid handles", () => {
      expect(isValidTwitterHandle("elonmusk")).toBe(true);
      expect(isValidTwitterHandle("@elonmusk")).toBe(true);
      expect(isValidTwitterHandle("VitalikButerin")).toBe(true);
      expect(isValidTwitterHandle("web3_dev")).toBe(true);
    });

    it("should reject invalid handles", () => {
      expect(isValidTwitterHandle("")).toBe(false);
      expect(isValidTwitterHandle("this_handle_is_too_long_for_twitter")).toBe(false);
      expect(isValidTwitterHandle("bad-handle")).toBe(false);
    });
  });

  describe("Twitter Status URL", () => {
    it("should validate valid status URLs", () => {
      expect(isValidTwitterUrl("https://twitter.com/VitalikButerin/status/123456789")).toBe(true);
      expect(isValidTwitterUrl("https://x.com/VitalikButerin/status/123456789")).toBe(true);
      expect(isValidTwitterUrl("https://www.x.com/user/status/123")).toBe(true);
    });

    it("should reject invalid status URLs", () => {
      expect(isValidTwitterUrl("https://twitter.com/VitalikButerin")).toBe(false);
      expect(isValidTwitterUrl("https://google.com/status/123")).toBe(false);
      expect(isValidTwitterUrl("https://x.com/user/status/abc")).toBe(false);
      expect(isValidTwitterUrl("not-a-url")).toBe(false);
    });
  });
});

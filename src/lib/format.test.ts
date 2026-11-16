import { describe, expect, it } from "vitest";

import { formatCurrency, formatNumber } from "./format";

describe("formatCurrency", () => {
  it("formats whole US dollars without decimals", () => {
    expect(formatCurrency(180)).toBe("$180");
    expect(formatCurrency(1250)).toBe("$1,250");
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(5300000)).toBe("5,300,000");
  });
});

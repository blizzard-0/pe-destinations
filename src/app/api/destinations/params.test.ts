import { describe, expect, it } from "vitest";

import { parseDestinationQuery } from "./params";

const parse = (query: string) =>
  parseDestinationQuery(new URLSearchParams(query));

const DEFAULTS = { sort: "name", order: "asc", page: 1, pageSize: 20 };

describe("parseDestinationQuery", () => {
  it("applies defaults when no parameters are given", () => {
    expect(parse("").data).toEqual(DEFAULTS);
  });

  it("parses and coerces valid parameters", () => {
    const result = parse(
      "q=beach&costLevel=Budget&minBudget=50&maxBudget=100&sort=budget&order=desc&page=2&pageSize=10",
    );

    expect(result.data).toEqual({
      q: "beach",
      costLevel: "Budget",
      minBudget: 50,
      maxBudget: 100,
      sort: "budget",
      order: "desc",
      page: 2,
      pageSize: 10,
    });
  });

  it("treats empty and whitespace-only parameters as missing", () => {
    expect(parse("region=&q=%20%20").data).toEqual(DEFAULTS);
  });

  it.each([
    "page=abc",
    "page=0",
    "page=1.5",
    "pageSize=51",
    "costLevel=Cheap",
    "sort=price",
    "minBudget=-1",
  ])("rejects invalid input: %s", (query) => {
    expect(parse(query).success).toBe(false);
  });

  it("rejects a minBudget greater than maxBudget", () => {
    const result = parse("minBudget=300&maxBudget=100");

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["minBudget"]);
  });
});

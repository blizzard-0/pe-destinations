import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import type { DestinationQuery } from "./params";
import { buildWhere, escapeLike } from "./query";

const dialect = new PgDialect();

const baseQuery: DestinationQuery = {
  sort: "name",
  order: "asc",
  page: 1,
  pageSize: 20,
};

describe("escapeLike", () => {
  it("escapes LIKE wildcards and the escape character", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });

  it("leaves ordinary text unchanged", () => {
    expect(escapeLike("Beach & Relaxation")).toBe("Beach & Relaxation");
  });
});

describe("buildWhere", () => {
  it("returns no condition when no filters are given", () => {
    expect(buildWhere(baseQuery)).toBeUndefined();
  });

  it("searches with an escaped pattern", () => {
    const where = buildWhere({ ...baseQuery, q: "50%" });

    expect(where).toBeDefined();
    const { params } = dialect.sqlToQuery(where!);
    expect(params).toContain("%50\\%%");
  });

  it("keeps a minBudget of 0", () => {
    const where = buildWhere({ ...baseQuery, minBudget: 0 });

    expect(where).toBeDefined();
    const { params } = dialect.sqlToQuery(where!);
    expect(params).toContain(0);
  });
});

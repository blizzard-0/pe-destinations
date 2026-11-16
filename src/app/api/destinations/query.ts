import {
  and,
  arrayContains,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { destinations } from "@/db/schema";

import type { DestinationQuery } from "./params";

// In LIKE patterns, "%" and "_" are wildcards and "\" is the escape character.
// Escape them so user input is matched literally.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

const buildWhere = (query: DestinationQuery): SQL | undefined => {
  const conditions: (SQL | undefined)[] = [];

  if (query.q) {
    const pattern = `%${escapeLike(query.q)}%`;
    conditions.push(
      or(
        ilike(destinations.name, pattern),
        ilike(destinations.country, pattern),
        ilike(destinations.region, pattern),
        sql`array_to_string(${destinations.activities}, ' ') ILIKE ${pattern}`,
      ),
    );
  }

  if (query.region) {
    conditions.push(eq(destinations.region, query.region));
  }

  if (query.costLevel) {
    conditions.push(eq(destinations.costLevel, query.costLevel));
  }

  if (query.activity) {
    conditions.push(arrayContains(destinations.activities, [query.activity]));
  }

  if (query.minBudget !== undefined) {
    conditions.push(gte(destinations.averageDailyBudget, query.minBudget));
  }

  if (query.maxBudget !== undefined) {
    conditions.push(lte(destinations.averageDailyBudget, query.maxBudget));
  }

  return and(...conditions);
};

const SORT_COLUMNS: Record<DestinationQuery["sort"], AnyPgColumn> = {
  name: destinations.name,
  budget: destinations.averageDailyBudget,
  visitors: destinations.annualVisitors,
  costLevel: destinations.costLevel,
};

const buildOrderBy = (query: DestinationQuery): SQL[] => {
  const direction = query.order === "desc" ? desc : asc;

  // Always break ties by id so pagination is stable.
  return [direction(SORT_COLUMNS[query.sort]), asc(destinations.id)];
};

export { buildOrderBy, buildWhere, escapeLike };

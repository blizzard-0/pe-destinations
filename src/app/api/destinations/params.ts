import { z } from "zod";

import { costLevelEnum } from "@/db/schema";

const SORT_FIELDS = ["name", "budget", "visitors", "costLevel"] as const;
const MAX_PAGE_SIZE = 50;

const destinationQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    region: z.string().trim().max(100).optional(),
    costLevel: z.enum(costLevelEnum.enumValues).optional(),
    activity: z.string().trim().max(100).optional(),
    minBudget: z.coerce.number().int().min(0).optional(),
    maxBudget: z.coerce.number().int().min(0).optional(),
    sort: z.enum(SORT_FIELDS).default("name"),
    order: z.enum(["asc", "desc"]).default("asc"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
  })
  .refine(
    ({ minBudget, maxBudget }) =>
      minBudget === undefined ||
      maxBudget === undefined ||
      minBudget <= maxBudget,
    {
      error: "minBudget must not be greater than maxBudget",
      path: ["minBudget"],
    },
  );

type DestinationQuery = z.infer<typeof destinationQuerySchema>;

const parseDestinationQuery = (searchParams: URLSearchParams) => {
  // Treat empty parameters (e.g. "?region=") as if they weren't sent.
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (value.trim() !== "") {
      raw[key] = value;
    }
  });

  return destinationQuerySchema.safeParse(raw);
};

export { MAX_PAGE_SIZE, SORT_FIELDS, parseDestinationQuery };
export type { DestinationQuery };

import {
  pgTable,
  pgEnum,
  integer,
  text,
  serial,
  timestamp,
  bigint,
  unique,
  index,
} from "drizzle-orm/pg-core";

const costLevelEnum = pgEnum("cost_level", [
  "Budget",
  "Moderate",
  "Premium",
  "Luxury",
]);

const destinations = pgTable(
  "destinations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    region: text("region").notNull(),
    costLevel: costLevelEnum("cost_level").notNull(),
    activities: text("activities").array().notNull(),
    averageDailyBudget: integer("average_daily_budget").notNull(),
    annualVisitors: bigint("annual_visitors", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameCountryUnique: unique("destinations_name_country_unique").on(
      table.name,
      table.country,
    ),
    regionIdx: index("destinations_region_idx").on(table.region),
    averageDailyBudgetIdx: index("destinations_average_daily_budget_idx").on(
      table.averageDailyBudget,
    ),
    activitiesIdx: index("destinations_activities_idx").using(
      "gin",
      table.activities,
    ),
  }),
);

type Destination = typeof destinations.$inferSelect;
type NewDestination = typeof destinations.$inferInsert;

export { costLevelEnum, destinations };
export type { Destination, NewDestination };

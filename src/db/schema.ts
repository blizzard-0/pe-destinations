import {
  pgTable,
  pgEnum,
  integer,
  text,
  serial,
  timestamp,
  bigint,
  unique,
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
  }),
);

export { costLevelEnum, destinations };

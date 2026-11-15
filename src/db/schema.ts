import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  integer,
  text,
  jsonb,
  serial,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";

const costLevelEnum = pgEnum("cost_level", [
  "Budget",
  "Moderate",
  "Premium",
  "Luxury",
]);

const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  costLevel: costLevelEnum("cost_level").notNull(),
  activities: jsonb("activities").default([]).notNull(),
  averageDailyBudget: integer("average_daily_budget").notNull(),
  annualVisitors: bigint("annual_visitors", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export { costLevelEnum, destinations };

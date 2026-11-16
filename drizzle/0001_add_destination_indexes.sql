CREATE INDEX IF NOT EXISTS "destinations_region_idx" ON "destinations" USING btree ("region");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "destinations_average_daily_budget_idx" ON "destinations" USING btree ("average_daily_budget");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "destinations_activities_idx" ON "destinations" USING gin ("activities");
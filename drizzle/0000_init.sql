DO $$ BEGIN
 CREATE TYPE "public"."cost_level" AS ENUM('Budget', 'Moderate', 'Premium', 'Luxury');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"region" text NOT NULL,
	"cost_level" "cost_level" NOT NULL,
	"activities" text[] NOT NULL,
	"average_daily_budget" integer NOT NULL,
	"annual_visitors" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destinations_name_country_unique" UNIQUE("name","country")
);

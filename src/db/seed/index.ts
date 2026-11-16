import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { destinations } from "../schema";
import { destinationData } from "./destinations";

const seed = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    await db
      .insert(destinations)
      .values(destinationData)
      .onConflictDoUpdate({
        target: [destinations.name, destinations.country],
        set: {
          region: sql`excluded.region`,
          costLevel: sql`excluded.cost_level`,
          activities: sql`excluded.activities`,
          averageDailyBudget: sql`excluded.average_daily_budget`,
          annualVisitors: sql`excluded.annual_visitors`,
        },
      });

    console.log(`Seeded ${destinationData.length} destinations.`);
  } finally {
    await client.end();
  }
};

seed().catch((error) => {
  console.error("Failed to seed the database.");
  console.error(error);
  process.exit(1);
});

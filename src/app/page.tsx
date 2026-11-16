import { DestinationSearch } from "@/components/destination-search";
import db from "@/db";
import { costLevelEnum, destinations } from "@/db/schema";

type HomeProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

// The region filter is optional, so the page still renders without it if this fails.
const loadRegions = async () => {
  try {
    const rows = await db
      .selectDistinct({ region: destinations.region })
      .from(destinations)
      .orderBy(destinations.region);

    return rows.map((row) => row.region);
  } catch (error) {
    console.error("Failed to load regions", error);
    return [];
  }
};

export default async function Home({ searchParams }: HomeProps) {
  // Start from the query in the URL, so refreshes and shared links keep it.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  const regions = await loadRegions();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">
        Project Expedition Destinations
      </h1>
      <DestinationSearch
        initialQueryString={params.toString()}
        regions={regions}
        costLevels={costLevelEnum.enumValues}
      />
    </main>
  );
}

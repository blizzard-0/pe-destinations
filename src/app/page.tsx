import { DestinationSearch } from "@/components/destination-search";

type HomeProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function Home({ searchParams }: HomeProps) {
  // Start from the query in the URL, so refreshes and shared links keep it.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  return (
    <main style={{ margin: "24px" }}>
      <h1>Project Expedition Destinations</h1>
      <br />
      <br />
      <DestinationSearch initialQueryString={params.toString()} />
    </main>
  );
}

"use client";

import { useEffect, useState, type ChangeEvent } from "react";

import type {
  DestinationJson,
  DestinationsResponse,
} from "@/app/api/destinations/types";

const SEARCH_DEBOUNCE_MS = 300;

type Status = "loading" | "success" | "error";

export default function Home() {
  const [destinations, setDestinations] = useState<DestinationJson[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [searchTerm, setSearchTerm] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const q = searchTerm.trim();

    // Wait until the user stops typing, but load the full list right away.
    const timeout = setTimeout(
      async () => {
        const params = new URLSearchParams();
        if (q) {
          params.set("q", q);
        }

        setStatus("loading");
        try {
          const response = await fetch(`/api/destinations?${params}`, {
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const body: DestinationsResponse = await response.json();
          setDestinations(body.data);
          setStatus("success");
        } catch (error) {
          // A newer search cancelled this request, so its result no longer matters.
          if (controller.signal.aborted) {
            return;
          }
          console.error(error);
          setStatus("error");
        }
      },
      q ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
    // retryCount isn't read inside the effect; changing it re-runs the request.
  }, [searchTerm, retryCount]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onReset = () => {
    setSearchTerm("");
  };

  const onRetry = () => {
    setRetryCount((count) => count + 1);
  };

  return (
    <main style={{ margin: "24px" }}>
      <h1>Project Expedition Destinations</h1>
      <br />
      <br />
      <div>
        <p>Search</p>
        <p>
          Searching for: <span>{searchTerm}</span>
        </p>
        <input
          style={{ border: "1px solid black" }}
          value={searchTerm}
          onChange={onChange}
        />
        <button onClick={onReset}>Reset Search</button>
      </div>
      <br />
      <br />

      {status === "loading" && <p role="status">Loading destinations…</p>}

      {status === "error" && (
        <div role="alert">
          <p>Something went wrong while loading destinations.</p>
          <button onClick={onRetry}>Try again</button>
        </div>
      )}

      {status === "success" && destinations.length === 0 && (
        <p>
          {searchTerm.trim()
            ? "No destinations match your search."
            : "No destinations found."}
        </p>
      )}

      {status !== "error" && destinations.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Country</th>
              <th>Region</th>
              <th>Cost Level</th>
              <th>Activities</th>
              <th>Avg. Daily Budget</th>
              <th>Annual Visitors</th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((destination) => (
              <tr key={destination.id}>
                <td>{destination.name}</td>
                <td>{destination.country}</td>
                <td>{destination.region}</td>
                <td>{destination.costLevel}</td>
                <td>
                  {destination.activities.map((activity) => (
                    <div key={activity}>{activity}</div>
                  ))}
                </td>
                <td>{destination.averageDailyBudget}</td>
                <td>{destination.annualVisitors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

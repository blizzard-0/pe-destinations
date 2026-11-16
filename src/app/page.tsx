"use client";

import { useEffect, useState, type ChangeEvent } from "react";

import type {
  DestinationJson,
  DestinationsResponse,
} from "@/app/api/destinations/types";

const SEARCH_DEBOUNCE_MS = 300;

export default function Home() {
  const [destinations, setDestinations] = useState<DestinationJson[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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

        try {
          const response = await fetch(`/api/destinations?${params}`, {
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const body: DestinationsResponse = await response.json();
          setDestinations(body.data);
        } catch (error) {
          // A newer search cancelled this request, so its result no longer matters.
          if (!controller.signal.aborted) {
            console.error(error);
          }
        }
      },
      q ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchTerm]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onReset = () => {
    setSearchTerm("");
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
    </main>
  );
}

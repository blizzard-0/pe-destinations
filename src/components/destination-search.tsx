"use client";

import { useState, type ChangeEvent } from "react";

import { DestinationsTable } from "@/components/destinations-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDestinations } from "@/hooks/use-destinations";

const SEARCH_DEBOUNCE_MS = 300;

const DestinationSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const q = searchTerm.trim();
  // Load the full list right away; only wait while the user is typing.
  const debouncedQ = useDebouncedValue(q, q ? SEARCH_DEBOUNCE_MS : 0);

  const params = new URLSearchParams();
  if (debouncedQ) {
    params.set("q", debouncedQ);
  }
  const { destinations, status, retry } = useDestinations(params.toString());

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onReset = () => {
    setSearchTerm("");
  };

  return (
    <>
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
          <button onClick={retry}>Try again</button>
        </div>
      )}

      {status === "success" && destinations.length === 0 && (
        <p>
          {q ? "No destinations match your search." : "No destinations found."}
        </p>
      )}

      {status !== "error" && destinations.length > 0 && (
        <DestinationsTable destinations={destinations} />
      )}
    </>
  );
};

export { DestinationSearch };

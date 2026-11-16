"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { DestinationsTable } from "@/components/destinations-table";
import { useDestinations } from "@/hooks/use-destinations";

const SEARCH_DEBOUNCE_MS = 300;

type DestinationSearchProps = {
  initialQueryString: string;
};

const DestinationSearch = ({ initialQueryString }: DestinationSearchProps) => {
  // The query string is the single source of truth for what's shown.
  const [queryString, setQueryString] = useState(initialQueryString);
  const [searchTerm, setSearchTerm] = useState(
    () => new URLSearchParams(initialQueryString).get("q") ?? "",
  );
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const { destinations, status, retry } = useDestinations(queryString);

  // Mirror the query in the URL, so results can be refreshed and shared.
  useEffect(() => {
    const url = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [queryString]);

  // Don't run a pending search after the component is gone.
  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  const updateQuery = (changes: Record<string, string>) => {
    setQueryString((previous) => {
      const params = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Any change other than paging starts again from the first page.
      if (!("page" in changes)) {
        params.delete("page");
      }
      return params.toString();
    });
  };

  const onSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(
      () => updateQuery({ q: value.trim() }),
      SEARCH_DEBOUNCE_MS,
    );
  };

  const onReset = () => {
    clearTimeout(searchTimeout.current);
    setSearchTerm("");
    setQueryString("");
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
          onChange={onSearchChange}
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
          {queryString
            ? "No destinations match your search."
            : "No destinations found."}
        </p>
      )}

      {status !== "error" && destinations.length > 0 && (
        <DestinationsTable destinations={destinations} />
      )}
    </>
  );
};

export { DestinationSearch };

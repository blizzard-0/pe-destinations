"use client";
import { useEffect, useRef, useState } from "react";

import { DestinationFilters } from "@/components/destination-filters";
import { DestinationsTable } from "@/components/destinations-table";
import { useDestinations } from "@/hooks/use-destinations";

const SEARCH_DEBOUNCE_MS = 300;

type DestinationSearchProps = {
  initialQueryString: string;
  regions: string[];
  costLevels: readonly string[];
};

const DestinationSearch = ({
  initialQueryString,
  regions,
  costLevels,
}: DestinationSearchProps) => {
  // The query string is the single source of truth for what's shown.
  const [queryString, setQueryString] = useState(initialQueryString);
  const [searchTerm, setSearchTerm] = useState(
    () => new URLSearchParams(initialQueryString).get("q") ?? "",
  );
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const { destinations, status, retry } = useDestinations(queryString);
  const currentParams = new URLSearchParams(queryString);

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

  const onSearchChange = (value: string) => {
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
    <div className="flex flex-col gap-6">
      <DestinationFilters
        searchTerm={searchTerm}
        region={currentParams.get("region") ?? ""}
        costLevel={currentParams.get("costLevel") ?? ""}
        regions={regions}
        costLevels={costLevels}
        onSearchChange={onSearchChange}
        onFilterChange={(name, value) => updateQuery({ [name]: value })}
        onReset={onReset}
      />

      <p role="status" className="h-5 text-sm text-gray-500">
        {status === "loading" ? "Loading destinations…" : ""}
      </p>

      {status === "error" && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p>Something went wrong while loading destinations.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {status === "success" && destinations.length === 0 && (
        <p className="text-sm text-gray-500">
          {queryString
            ? "No destinations match your filters."
            : "No destinations found."}
        </p>
      )}

      {status !== "error" && destinations.length > 0 && (
        <DestinationsTable destinations={destinations} />
      )}
    </div>
  );
};

export { DestinationSearch };

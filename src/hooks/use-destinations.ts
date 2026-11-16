import { useEffect, useState } from "react";

import type {
  DestinationJson,
  DestinationsResponse,
  Pagination,
} from "@/app/api/destinations/types";

type Status = "loading" | "success" | "error";

// Fetches destinations for a query string and cancels outdated requests.
const useDestinations = (queryString: string) => {
  const [destinations, setDestinations] = useState<DestinationJson[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetch(`/api/destinations?${queryString}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const body: DestinationsResponse = await response.json();
        setDestinations(body.data);
        setPagination(body.pagination);
        setStatus("success");
      } catch (error) {
        // A newer request cancelled this one, so its result no longer matters.
        if (controller.signal.aborted) {
          return;
        }
        console.error(error);
        setStatus("error");
      }
    };

    load();

    return () => controller.abort();
    // retryCount isn't read inside the effect; changing it re-runs the request.
  }, [queryString, retryCount]);

  const retry = () => setRetryCount((count) => count + 1);

  return { destinations, pagination, status, retry };
};

export { useDestinations };

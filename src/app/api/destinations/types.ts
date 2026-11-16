import type { Destination } from "@/db/schema";

// JSON has no Date type, so timestamps arrive as ISO strings.
type DestinationJson = Omit<Destination, "createdAt"> & { createdAt: string };

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type DestinationsResponse = {
  data: DestinationJson[];
  pagination: Pagination;
};

type ApiError = {
  error: {
    message: string;
    issues?: { path: string; message: string }[];
  };
};

export type { ApiError, DestinationJson, DestinationsResponse, Pagination };

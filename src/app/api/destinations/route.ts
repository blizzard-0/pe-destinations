import { count } from "drizzle-orm";
import type { NextRequest } from "next/server";

import db from "@/db";
import { destinations } from "@/db/schema";

import { parseDestinationQuery } from "./params";
import { buildOrderBy, buildWhere } from "./query";

// Results depend on the query string and the database contents,
// so this route must never be cached at build time.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const result = parseDestinationQuery(request.nextUrl.searchParams);

  if (!result.success) {
    return Response.json(
      {
        error: {
          message: "Invalid query parameters",
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 400 },
    );
  }

  const query = result.data;
  const where = buildWhere(query);

  try {
    const [data, [{ total }]] = await Promise.all([
      db
        .select()
        .from(destinations)
        .where(where)
        .orderBy(...buildOrderBy(query))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ total: count() }).from(destinations).where(where),
    ]);

    return Response.json({
      data,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to load destinations", error);

    return Response.json(
      { error: { message: "Something went wrong" } },
      { status: 500 },
    );
  }
}

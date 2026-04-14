import { NextResponse } from "next/server";
import { FetchAdapter } from "@/adapter/fetch.adapter";

const http = new FetchAdapter();

const ALLOWED = [
  "page",
  "processNumber",
  "courtAcronym",
  "publicationDateFrom",
  "publicationDateTo",
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forwarded = new URLSearchParams();
  for (const key of ALLOWED) {
    const value = searchParams.get(key);
    if (value) forwarded.set(key, value);
  }

  const query = forwarded.toString();
  const endpoint = `processes${query ? `?${query}` : ""}`;

  try {
    const response = await http.get(endpoint);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_EXPIRED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { FetchAdapter } from "@/adapter/fetch.adapter";

const http = new FetchAdapter();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";

  const endpoint = `processes/${encodeURIComponent(id)}/communications?page=${encodeURIComponent(page)}`;

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

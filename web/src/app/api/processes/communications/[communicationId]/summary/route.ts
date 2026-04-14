import { NextResponse } from "next/server";
import { FetchAdapter } from "@/adapter/fetch.adapter";

const http = new FetchAdapter();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ communicationId: string }> },
) {
  const { communicationId } = await params;
  const endpoint = `processes/communications/${encodeURIComponent(communicationId)}/summary`;

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

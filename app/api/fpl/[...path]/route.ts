// app/api/fpl/[...path]/route.ts
// Proxy route to bypass CORS when fetching from FPL API.

import { NextRequest, NextResponse } from "next/server";

const FPL_BASE = "https://fantasy.premierleague.com/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${FPL_BASE}/${pathString}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PaperH2HLab/1.0)"
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `FPL API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("FPL proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from FPL API" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSeries } from "@/services/series-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const series = await getSeries(id);

    if (!series || !series.posterUrl) {
      return new NextResponse("Cover not found", { status: 404 });
    }

    try {
      new URL(series.posterUrl);
      return NextResponse.redirect(series.posterUrl);
    } catch {
      const url = new URL(series.posterUrl, request.url);
      return NextResponse.redirect(url.toString());
    }
  } catch (error) {
    console.error("Error fetching series cover:", error);
    return new NextResponse("Cover not found", { status: 404 });
  }
}

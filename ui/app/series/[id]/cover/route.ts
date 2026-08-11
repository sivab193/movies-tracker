import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiUrl = new URL(`/api/series/${id}`, request.url);
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      return new NextResponse("Cover not found", { status: 404 });
    }
    
    const series = await response.json();

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

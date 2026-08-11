import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiUrl = new URL(`/api/movies/${id}`, request.url);
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      return new NextResponse("Cover not found", { status: 404 });
    }
    
    const movie = await response.json();

    if (!movie || !movie.posterUrl) {
      return new NextResponse("Cover not found", { status: 404 });
    }

    try {
      new URL(movie.posterUrl);
      return NextResponse.redirect(movie.posterUrl);
    } catch {
      const url = new URL(movie.posterUrl, request.url);
      return NextResponse.redirect(url.toString());
    }
  } catch (error) {
    console.error("Error fetching movie cover:", error);
    return new NextResponse("Cover not found", { status: 404 });
  }
}

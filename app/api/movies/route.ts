import { NextRequest, NextResponse } from "next/server"

// In-memory store for demo mode (when Firebase isn't configured)
const mockMovies: Map<string, Record<string, unknown>> = new Map()

// Check if Firebase is configured
function checkFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  return Boolean(apiKey && projectId && apiKey !== "undefined" && projectId !== "undefined")
}

// Fetch movie data from OMDB API (free IMDb data)
async function fetchMovieFromOmdb(imdbId: string) {
  const apiKey = process.env.OMDB_API_KEY
  
  if (!apiKey) {
    // Return mock data if no API key
    console.log("[v0] No OMDB_API_KEY, using mock movie data")
    return {
      Title: `Movie ${imdbId}`,
      Year: "2024",
      Poster: "N/A",
      imdbRating: "N/A",
      Runtime: "N/A",
    }
  }

  const response = await fetch(
    `https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`
  )

  if (!response.ok) {
    throw new Error("Failed to fetch movie data")
  }

  const data = await response.json()

  if (data.Error) {
    throw new Error(data.Error)
  }

  return data
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imdbId } = body

    const isFirebaseConfigured = checkFirebaseConfig()
    console.log("[v0] Adding movie with imdbId:", imdbId, "Firebase configured:", isFirebaseConfigured)

    if (!imdbId || !/^tt\d{7,8}$/.test(imdbId)) {
      return NextResponse.json(
        { error: "Invalid IMDb ID format" },
        { status: 400 }
      )
    }

    // Fetch movie data from OMDB
    const omdbData = await fetchMovieFromOmdb(imdbId)
    console.log("[v0] OMDB data fetched:", omdbData.Title)

    const movieData = {
      imdbId,
      title: omdbData.Title,
      year: parseInt(omdbData.Year) || new Date().getFullYear(),
      posterUrl: omdbData.Poster !== "N/A" ? omdbData.Poster : null,
      imdbRating: omdbData.imdbRating !== "N/A" ? parseFloat(omdbData.imdbRating) : null,
      runtime: omdbData.Runtime !== "N/A" ? omdbData.Runtime : null,
      submissionCount: 0,
      averageTimeSeconds: null,
      createdAt: new Date().toISOString(),
    }

    // Use Firebase if configured, otherwise use mock storage
    if (isFirebaseConfigured) {
      // Dynamically import Firebase only when needed
      const { collection, doc, setDoc, serverTimestamp, query, where, getDocs } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      
      if (!db) {
        throw new Error("Firebase database not initialized")
      }

      // Check if movie already exists
      const moviesRef = collection(db, "movies")
      const q = query(moviesRef, where("imdbId", "==", imdbId))
      const existingDocs = await getDocs(q)

      if (!existingDocs.empty) {
        const existingMovie = existingDocs.docs[0]
        return NextResponse.json({
          message: "Movie already exists",
          movie: { id: existingMovie.id, ...existingMovie.data() },
        })
      }

      // Create new movie document
      const movieRef = doc(collection(db, "movies"))
      await setDoc(movieRef, {
        ...movieData,
        createdAt: serverTimestamp(),
      })

      return NextResponse.json({
        message: "Movie added successfully",
        movie: { id: movieRef.id, ...movieData },
      })
    } else {
      // Demo mode - use in-memory storage
      console.log("[v0] Using demo mode (no Firebase)")
      
      // Check if exists in mock storage
      if (mockMovies.has(imdbId)) {
        return NextResponse.json({
          message: "Movie already exists",
          movie: mockMovies.get(imdbId),
        })
      }

      const mockId = `mock_${Date.now()}`
      const mockMovie = { id: mockId, ...movieData }
      mockMovies.set(imdbId, mockMovie)

      return NextResponse.json({
        message: "Movie added successfully (demo mode)",
        movie: mockMovie,
      })
    }
  } catch (error) {
    console.error("[v0] Error adding movie:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add movie" },
      { status: 500 }
    )
  }
}

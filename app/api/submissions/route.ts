import { NextRequest, NextResponse } from "next/server"
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { headers } from "next/headers"

// Simple rate limiting - check if IP has submitted recently
async function checkRateLimit(deviceId: string, movieId: string): Promise<boolean> {
  const submissionsRef = collection(db, "titleCardSubmissions")
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const q = query(
    submissionsRef,
    where("deviceId", "==", deviceId),
    where("movieId", "==", movieId),
    where("createdAt", ">", Timestamp.fromDate(oneHourAgo))
  )

  const recentSubmissions = await getDocs(q)
  return recentSubmissions.empty
}

// Get device ID from headers (IP-based for anonymous rate limiting)
function getDeviceId(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  return `ip_${ip}`
}

// Update movie's average time
async function updateMovieAverageTime(movieId: string) {
  const submissionsRef = collection(db, "titleCardSubmissions")
  const q = query(submissionsRef, where("movieId", "==", movieId))
  const submissions = await getDocs(q)

  if (submissions.empty) return

  const times = submissions.docs.map((doc) => doc.data().timeInSeconds)
  const average = Math.round(times.reduce((a, b) => a + b, 0) / times.length)

  const movieRef = doc(db, "movies", movieId)
  await updateDoc(movieRef, {
    averageTimeSeconds: average,
    submissionCount: submissions.size,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, timeInSeconds, rawInput, comment } = body

    if (!movieId || typeof timeInSeconds !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate time is reasonable (under 2 hours)
    if (timeInSeconds < 0 || timeInSeconds > 7200) {
      return NextResponse.json(
        { error: "Invalid time value" },
        { status: 400 }
      )
    }

    // Check if movie exists
    const movieRef = doc(db, "movies", movieId)
    const movieSnap = await getDoc(movieRef)

    if (!movieSnap.exists()) {
      return NextResponse.json(
        { error: "Movie not found" },
        { status: 404 }
      )
    }

    // Rate limiting
    const headersList = await headers()
    const deviceId = getDeviceId(headersList)
    const canSubmit = await checkRateLimit(deviceId, movieId)

    if (!canSubmit) {
      return NextResponse.json(
        { error: "You've already submitted for this movie recently. Please wait an hour." },
        { status: 429 }
      )
    }

    // Create submission
    const submissionRef = await addDoc(collection(db, "titleCardSubmissions"), {
      movieId,
      timeInSeconds,
      rawInput,
      comment: comment || null,
      deviceId,
      createdAt: serverTimestamp(),
    })

    // Update movie average
    await updateMovieAverageTime(movieId)

    return NextResponse.json({
      message: "Submission added successfully",
      submissionId: submissionRef.id,
    })
  } catch (error) {
    console.error("Error adding submission:", error)
    return NextResponse.json(
      { error: "Failed to add submission" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get("movieId")

    if (!movieId) {
      return NextResponse.json(
        { error: "Movie ID required" },
        { status: 400 }
      )
    }

    const submissionsRef = collection(db, "titleCardSubmissions")
    const q = query(
      submissionsRef,
      where("movieId", "==", movieId),
      orderBy("createdAt", "desc")
    )

    const snapshot = await getDocs(q)
    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }))

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    )
  }
}

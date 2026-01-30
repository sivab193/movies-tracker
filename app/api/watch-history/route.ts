import { NextRequest, NextResponse } from "next/server"
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const historyRef = collection(db, "watchHistory")
    const q = query(
      historyRef,
      where("uid", "==", uid),
      orderBy("showTime", "desc")
    )

    const snapshot = await getDocs(q)
    const history = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      showTime: doc.data().showTime?.toDate?.() || new Date(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }))

    return NextResponse.json({ history })
  } catch (error) {
    console.error("Error fetching watch history:", error)
    return NextResponse.json(
      { error: "Failed to fetch watch history" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      uid,
      movieId,
      movieTitle,
      moviePosterUrl,
      theaterName,
      theaterLocation,
      showTime,
      ticketCost,
      currency,
    } = body

    if (!uid || !movieId || !theaterName || !showTime || ticketCost === undefined || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["INR", "USD"].includes(currency)) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 })
    }

    const historyRef = await addDoc(collection(db, "watchHistory"), {
      uid,
      movieId,
      movieTitle,
      moviePosterUrl: moviePosterUrl || null,
      theaterName,
      theaterLocation: theaterLocation || null,
      showTime: new Date(showTime),
      ticketCost: parseFloat(ticketCost),
      currency,
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({
      message: "Watch history entry added",
      id: historyRef.id,
    })
  } catch (error) {
    console.error("Error adding watch history:", error)
    return NextResponse.json(
      { error: "Failed to add watch history" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 })
    }

    const docRef = doc(db, "watchHistory", id)
    
    // Convert showTime if present
    if (updates.showTime) {
      updates.showTime = new Date(updates.showTime)
    }

    await updateDoc(docRef, updates)

    return NextResponse.json({ message: "Watch history updated" })
  } catch (error) {
    console.error("Error updating watch history:", error)
    return NextResponse.json(
      { error: "Failed to update watch history" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 })
    }

    await deleteDoc(doc(db, "watchHistory", id))

    return NextResponse.json({ message: "Watch history entry deleted" })
  } catch (error) {
    console.error("Error deleting watch history:", error)
    return NextResponse.json(
      { error: "Failed to delete watch history" },
      { status: 500 }
    )
  }
}

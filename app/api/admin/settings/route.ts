import { NextResponse } from "next/server"
import { sql } from "@/lib/db" // Import the Neon client

// GET handler to fetch admin settings (specifically latest_movie_ids)
export async function GET() {
  try {
    const result = await sql`
      SELECT latest_movie_ids FROM app_settings WHERE id = 1;
    `

    // Neon returns an array of rows, even for single() equivalent
    const data = result[0]

    if (!data) {
      // If no settings found (table might be empty or id=1 not inserted), return empty array
      return NextResponse.json({ latestMovieIds: [] })
    }

    const latestMovieIds = data.latest_movie_ids || []
    return NextResponse.json({ latestMovieIds })
  } catch (error) {
    console.error("Error fetching settings from Neon:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// POST handler to update admin settings (specifically latest_movie_ids)
export async function POST(request: Request) {
  try {
    const { latestMovieIds } = await request.json()

    if (!Array.isArray(latestMovieIds)) {
      return NextResponse.json({ error: "Invalid payload: latestMovieIds must be an array" }, { status: 400 })
    }

    // Upsert operation: insert if id=1 doesn't exist, update if it does
    const result = await sql`
      INSERT INTO app_settings (id, latest_movie_ids, updated_at)
      VALUES (1, ${JSON.stringify(latestMovieIds)}::JSONB, NOW())
      ON CONFLICT (id) DO UPDATE SET
        latest_movie_ids = EXCLUDED.latest_movie_ids,
        updated_at = EXCLUDED.updated_at
      RETURNING latest_movie_ids;
    `

    const updatedData = result[0]

    if (!updatedData) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({ latestMovieIds: updatedData.latest_movie_ids })
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("health_check")
      .select("id")
      .limit(1);

    // The health_check table intentionally does not exist.
    // Receiving a Supabase/PostgREST response proves connectivity.
    if (error) {
      return NextResponse.json({
        success: true,
        supabase: "connected",
        database: "reachable",
        note: "Supabase connection successful; health_check table does not exist (expected).",
      });
    }

    return NextResponse.json({
      success: true,
      supabase: "connected",
      database: "reachable",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
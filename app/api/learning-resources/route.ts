import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);

    const skillId = searchParams.get("skill_id");
    const resourceType = searchParams.get("resource_type");

    let query = supabase
      .from("learning_resources")
      .select(
        "id, skill_id, title, description, resource_type, url, difficulty, duration_minutes"
      )
      .order("created_at", { ascending: false });

    if (skillId) {
      query = query.eq("skill_id", skillId);
    }

    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
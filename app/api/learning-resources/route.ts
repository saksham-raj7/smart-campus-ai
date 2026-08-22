import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const ALLOWED_RESOURCE_TYPES = [
  "youtube",
  "article",
  "documentation",
  "practice",
  "course",
] as const;

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const skillId = searchParams.get("skill_id");
    const resourceType = searchParams.get("type");

    if (
      resourceType &&
      !ALLOWED_RESOURCE_TYPES.includes(
        resourceType as (typeof ALLOWED_RESOURCE_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid resource type. Supported types: youtube, article, documentation, practice, course",
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from("learning_resources")
      .select(
        `
        id,
        skill_id,
        title,
        description,
        resource_type,
        url,
        provider,
        thumbnail,
        difficulty,
        duration_minutes,
        created_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (skillId) {
      query = query.eq("skill_id", skillId);
    }

    if (resourceType) {
      query = query.eq(
        "resource_type",
        resourceType
      );
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

    const resources = (data ?? []).map(
      (resource) => ({
        id: resource.id,
        skill_id: resource.skill_id,
        title: resource.title,
        description: resource.description,
        type: resource.resource_type,
        url: resource.url,
        provider: resource.provider,
        thumbnail: resource.thumbnail,
        difficulty: resource.difficulty,
        duration_minutes:
          resource.duration_minutes,
        created_at: resource.created_at,
      })
    );

    return NextResponse.json({
      success: true,
      data: resources,
      meta: {
        count: resources.length,
        supported_types:
          ALLOWED_RESOURCE_TYPES,
        filters: {
          skill_id: skillId,
          type: resourceType,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Learning resources fetch failed",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

    const location = searchParams.get("location");
    const jobType = searchParams.get("job_type");

    let query = supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    if (jobType) {
      query = query.eq("job_type", jobType);
    }

    const { data: jobs, error } = await query;

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
      data: jobs ?? [],
      count: jobs?.length ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch jobs",
      },
      { status: 500 }
    );
  }
}
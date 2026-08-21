import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const ALLOWED_STATUSES = [
  "saved",
  "applied",
  "interview",
  "rejected",
  "selected",
] as const;

type ApplicationStatus = (typeof ALLOWED_STATUSES)[number];

export async function GET() {
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

    const { data: applications, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        jobs (
          id,
          company,
          title,
          location,
          job_type,
          application_url
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

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
      data: applications ?? [],
      count: applications?.length ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch applications",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();

    const jobId = body.job_id;
    const status: ApplicationStatus = body.status ?? "saved";
    const notes = body.notes ?? null;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "job_id is required",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Make sure the selected job exists.
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 }
      );
    }

    const applicationData = {
      user_id: user.id,
      job_id: jobId,
      status,
      notes,
      applied_at: status === "applied" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: application, error } = await supabase
      .from("applications")
      .upsert(applicationData, {
        onConflict: "user_id,job_id",
      })
      .select(
        `
        *,
        jobs (
          id,
          company,
          title,
          location,
          job_type,
          application_url
        )
      `
      )
      .single();

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
      data: application,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save application",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "application id is required",
        },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }

      updates.status = body.status;

      if (body.status === "applied") {
        updates.applied_at = new Date().toISOString();
      }
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid fields provided",
        },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: application, error } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        jobs (
          id,
          company,
          title,
          location,
          job_type,
          application_url
        )
      `
      )
      .single();

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
      data: application,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update application",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

    const { data: settings, error } = await supabase
      .from("student_privacy_settings")
      .select(
        "user_id, anonymous_peer_benchmarking, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

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
      data: {
        anonymous_peer_benchmarking:
          settings?.anonymous_peer_benchmarking ?? true,
        updated_at: settings?.updated_at ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Privacy settings fetch failed",
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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("anonymous_peer_benchmarking" in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "anonymous_peer_benchmarking must be provided",
        },
        { status: 400 }
      );
    }

    const value = (
      body as {
        anonymous_peer_benchmarking?: unknown;
      }
    ).anonymous_peer_benchmarking;

    if (typeof value !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error:
            "anonymous_peer_benchmarking must be a boolean",
        },
        { status: 400 }
      );
    }

    const { data: settings, error } = await supabase
      .from("student_privacy_settings")
      .upsert(
        {
          user_id: user.id,
          anonymous_peer_benchmarking: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select(
        "user_id, anonymous_peer_benchmarking, updated_at"
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
      data: {
        anonymous_peer_benchmarking:
          settings.anonymous_peer_benchmarking,
        updated_at: settings.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Privacy settings update failed",
      },
      { status: 500 }
    );
  }
}
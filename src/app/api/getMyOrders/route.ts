import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

async function getUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return { user: null, supabase: null, error: new Error("Auth session missing!") };
  }

  const supabase = createSupabaseServerClient(token);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { user: null, supabase: null, error };
  }

  return { user: data.user, supabase, error: null };
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getUser(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message ?? "Not authenticated" },
        { status: 401 }
      );
    }

    // 1. Fetch this user's local order numbers
    const { data: localOrders, error: dbError } = await supabase
      .from("orders")
      .select("order_number")
      .eq("user_id", user.id);

    if (dbError) {
      console.error("❌ Failed to fetch local orders:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch user orders" },
        { status: 500 }
      );
    }

    const myOrderNumbers = new Set(
      (localOrders || [])
        .map(o => o.order_number)
        .filter(Boolean)
    );

    if (myOrderNumbers.size === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    // 2. Fetch ALL Qikink orders (from your existing endpoint)
    const baseUrl = request.nextUrl.origin;

    const qikinkRes = await fetch(`${baseUrl}/api/qikinkOrders`, {
      headers: {
        authorization: request.headers.get("authorization") || "",
      },
      cache: "no-store",
    });

    if (!qikinkRes.ok) {
      const txt = await qikinkRes.text();
      console.error("❌ Failed to fetch qikink orders:", txt);
      return NextResponse.json(
        { error: "Failed to fetch qikink orders" },
        { status: 500 }
      );
    }

    const allQikinkOrders = await qikinkRes.json();

    const qikinkOrdersArray = Array.isArray(allQikinkOrders)
      ? allQikinkOrders
      : allQikinkOrders?.orders || [];

    // 3. Filter only orders belonging to this user
    const filtered = qikinkOrdersArray.filter((o: any) =>
      myOrderNumbers.has(o.number)
    );

    console.log(
      `Returning ${filtered.length} qikink orders for user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      orders: filtered,
    });

  } catch (error) {
    console.error("❌ Unexpected error in getMyOrders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

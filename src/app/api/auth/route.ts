// src/app/api/auth/route.ts

import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

// ------------------------
// ENV VALIDATION
// ------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

{/*console.log("DEBUG ENV LOADED", {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});*/}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing required env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

// ------------------------
// SUPABASE ADMIN HELPERS
// ------------------------

// 1) Create Auth user via Admin API
async function adminCreateUser(email: string, password: string, name?: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY as string,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}` as string,
    } as HeadersInit,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    }),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { ok: res.ok, status: res.status, data: json };
}

// 2) Get user by email
async function adminGetUserByEmail(email: string) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      method: "GET",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      } as HeadersInit,
    }
  );

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  // Supabase sometimes returns: { users: [...] }
  if (Array.isArray(json)) return json;
  if (json?.users) return json.users;
  return [];
}

// 3) Upsert into profiles table
async function upsertProfile(userId: string, email: string, name?: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    } as HeadersInit,
    body: JSON.stringify([{ user_id: userId, email, name }]),
  });

  if (res.status === 204) return;

  const text = await res.text();
  if (!text) return;

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Failed to parse profile upsert response");
  }

  if (!res.ok) throw new Error(JSON.stringify(json));
}

// ------------------------
// MAIN ROUTE HANDLER
// ------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;
    const name = body.name ?? null;

    if (!email || !password)
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );

    // ------------------------
    // 1) Attempt to create user
    // ------------------------
    const create = await adminCreateUser(email, password, name);

    let userRecord = null;
    let isNewUser = false;

    if (create.ok) {
      userRecord = create.data;
      isNewUser = true;
    } else {
      // Handle "email_exists"
      if (
        create.status === 422 &&
        create.data?.error_code === "email_exists"
      ) {
        const existing = await adminGetUserByEmail(email);

        if (existing.length === 0) {
          return NextResponse.json(
            { error: "Unexpected Supabase error: user not found after email_exists" },
            { status: 500 }
          );
        }

        userRecord = existing[0];
        isNewUser = false;
      } else {
        return NextResponse.json(
          { error: "Failed to create user", details: create.data },
          { status: create.status }
        );
      }
    }

    // Normalizing response structure
    const userId =
      userRecord?.id ||
      userRecord?.user?.id ||
      userRecord?.sub ||
      null;

    if (!userId) {
      return NextResponse.json(
        { error: "Could not extract user id", raw: userRecord },
        { status: 500 }
      );
    }

    // ------------------------
    // 2) UPSERT profile
    // ------------------------
    try {
      await upsertProfile(userId, email, name ?? undefined);
    } catch (err) {
      console.error("Profile upsert error:", err);
    }

    // ------------------------
    // 3) SEND welcome email only for new users
    // ------------------------
    if (isNewUser) {
      try {
        await sendMail({
          to: email,
          subject: "Welcome to MINICON",
          template: "welcome",
          templateData: {
            name: name ?? email,
            email,
            siteName: "MINICON",
          },
        });
      } catch (err) {
        console.warn("Failed to send welcome email:", err);
      }
    }

    // ------------------------
    // SUCCESS RESPONSE
    // ------------------------
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        created: isNewUser,
      },
    });
  } catch (err: any) {
    console.error("Unhandled error in /api/auth:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error", stack: err.stack },
      { status: 500 }
    );
  }
}

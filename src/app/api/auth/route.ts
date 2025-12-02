// src/app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer"; // keep your mailer import (used later)

// Resolve envs (accepts multiple common names)
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "";

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  "";

// Debug-print what Next sees (useful while developing)
if (process.env.NODE_ENV === "development") {
  console.log("ENV DEBUG:", {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

// Early fail with a clear message if required server envs are missing.
// This prevents obscure 500s later and makes it obvious you must set a server-only key.
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing Supabase server env(s). SUPABASE_URL:",
    Boolean(SUPABASE_URL),
    "SERVICE_ROLE_KEY found:",
    Boolean(SERVICE_ROLE_KEY)
  );
  throw new Error(
    "Missing Supabase server env(s). Add SUPABASE_SERVICE_KEY (service role key) and SUPABASE_URL to .env.local and restart the dev server."
  );
}
async function adminCreateUser(email: string, password: string, name?: string) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users`;
  const body = {
    email,
    password,
    user_metadata: { name },
    email_confirm: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY || "",
      Authorization: `Bearer ${SERVICE_ROLE_KEY || ""}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.text().then((t) => {
    try { return JSON.parse(t); } catch { return t; }
  });

  return { ok: res.ok, status: res.status, body: json };
}

async function adminGetUserByEmail(email: string) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SERVICE_ROLE_KEY || "",
      Authorization: `Bearer ${SERVICE_ROLE_KEY || ""}`,
      "Content-Type": "application/json",
    },
  });
  const json = await res.text().then((t) => {
    try { return JSON.parse(t); } catch { return t; }
  });
  if (Array.isArray(json)) return json;
  if (json && Array.isArray((json as any).users)) return (json as any).users;
  return [];
}

async function upsertProfile(userId: string, email: string, name?: string) {
  const url = `${SUPABASE_URL}/rest/v1/profiles`;
  const payload = [{ user_id: userId, email, name }];
  const res = await fetch(url, {
    method: "POST", // POST + Prefer: resolution=merge-duplicates -> upsert
    headers: {
      apikey: SERVICE_ROLE_KEY || "",
      Authorization: `Bearer ${SERVICE_ROLE_KEY || ""}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(payload),
  });

  // Some Supabase REST upserts return 204 No Content — handle that gracefully
  if (res.status === 204) {
    // success, nothing to parse
    return [];
  }

  // Try to read body safely (handle empty body)
  const text = await res.text().catch(() => "");
  if (!text || text.trim().length === 0) {
    if (!res.ok) {
      throw new Error(`Failed to upsert profile: ${res.status} (empty body)`);
    }
    return [];
  }

  // Parse JSON safely
  try {
    const json = JSON.parse(text);
    if (!res.ok) {
      throw new Error(`Failed to upsert profile: ${res.status} ${JSON.stringify(json)}`);
    }
    return json;
  } catch (parseErr) {
    throw new Error(`Failed to parse profile upsert response: ${parseErr}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Quick env sanity check (very helpful)
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      const msg = `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env. SUPABASE_URL=${!!SUPABASE_URL}; SERVICE_ROLE_KEY=${!!SERVICE_ROLE_KEY}`;
      console.error(msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // parse body
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password;
    const name = body.name ?? null;

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    // Try creating the auth user
    let userWasCreated = false;
    let userRecord: any = null;
    try {
      const createResp = await adminCreateUser(email, password, name);
      console.log("adminCreateUser response:", createResp.status, createResp.body);
      if (createResp.ok) {
        userRecord = createResp.body;
        userWasCreated = true;
      } else {
        // creation failed — attempt to find existing user
        console.warn("create user failed, will try to fetch existing user by email", createResp.body);
        const users = await adminGetUserByEmail(email);
        if (users && users.length > 0) {
          return NextResponse.json(
            { error: "User already exists" },
            { status: 409 }
          );
        }
      }
    } catch (eCreate) {
      console.error("Exception while creating user via admin API:", eCreate);
      // attempt to fetch existing user
      try {
        const users = await adminGetUserByEmail(email);
        if (users && users.length > 0) {
          userRecord = users[0];
        } else {
          throw eCreate; // rethrow to outer catch
        }
      } catch (fetchErr) {
        console.error("Also failed fetching user after create error:", fetchErr);
        throw fetchErr;
      }
    }

    // derive user id
    const userId = userRecord?.id ?? userRecord?.user?.id ?? userRecord?.sub ?? null;
    if (!userId) {
      console.error("Could not find user id in userRecord:", userRecord);
      return NextResponse.json({ error: "Could not find user id in Supabase response", raw: userRecord }, { status: 500 });
    }

    // Upsert profile (non-fatal)
    try {
      await upsertProfile(userId, email, name ?? undefined);
      console.log("Profile upsert successful for user:", userId);
    } catch (upsertErr) {
      console.error("Profile upsert error:", upsertErr);
      // continue (do not abort); include message in response for debugging
    }

    // Send welcome mail only if created now
    try {
      if (userWasCreated) {
        await sendMail({
          to: email,
          subject: `Welcome to MINICON`,
          template: "welcome",
          templateData: { name: name ?? email, email, siteName: "MINICON" },
        });
        console.log("Welcome mail queued/sent to", email);
      } else {
        console.log("Skipping welcome mail because user was not newly created");
      }
    } catch (mailErr) {
      console.error("Failed to send welcome email:", mailErr);
      // non-fatal
    }

    return NextResponse.json({ success: true, user: { id: userId, email, created: userWasCreated } });
  } catch (err: any) {
    console.error("Unhandled error in /api/auth POST:", err);
    // return full error details while developing
    const message = err?.message ?? String(err);
    const stack = err?.stack ?? null;
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}

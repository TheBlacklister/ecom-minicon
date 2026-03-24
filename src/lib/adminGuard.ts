import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "./isAdmin";

export async function verifyAdmin(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") || "",
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!isAdmin(user.email)) {
    return { error: "Forbidden", status: 403 };
  }

  return { user }; // ✅ valid admin
}
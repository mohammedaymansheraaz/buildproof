import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Guest access needs Supabase admin credentials on the server." },
      { status: 503 },
    );
  }

  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const email = `guest-${suffix}@buildproof.local`;
  const password = `BuildProofGuest-${randomBytes(18).toString("base64url")}!`;

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "BuildProof Guest",
      guest: true,
    },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "BuildProof could not create a guest session." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    email,
    password,
    label: "BuildProof Guest",
  });
}

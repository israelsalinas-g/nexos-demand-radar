import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value; },
          set(name, value, options) { cookieStore.set({ name, value, ...options }); },
          remove(name, options) { cookieStore.set({ name, value: "", ...options }); },
        },
      },
    );

    await supabase.auth.exchangeCodeForSession(code);

    // Garantiza que el usuario tenga una org. Idempotente — no hace nada si ya existe.
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/setup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {
        // No bloqueamos el login si el API no está disponible
      });
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}

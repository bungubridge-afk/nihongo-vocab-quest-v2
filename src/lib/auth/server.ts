import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side auth helpers for Server Components, Server Actions and Route Handlers.
 * `getUser()` revalidates the token against the Supabase Auth server — never trust
 * client-provided state for anything gated.
 */

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

/** The verified signed-in user, or null (signed out / unconfigured / error). */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (supabase === null) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
}

/** Like getServerUser, but throws AuthRequiredError when there is no user. */
export async function requireUser(): Promise<User> {
  const user = await getServerUser();
  if (user === null) {
    throw new AuthRequiredError();
  }
  return user;
}

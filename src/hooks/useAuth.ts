"use client";

import { useAuthContext } from "@/components/providers/AuthProvider";
import type { AuthContextValue } from "@/types/auth";

/** Convenience hook — see AuthProvider for the semantics of each field. */
export function useAuth(): AuthContextValue {
  return useAuthContext();
}

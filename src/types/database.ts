import type { AppProgress } from "@/lib/progress/progressTypes";
import type {
  EntitlementSource,
  EntitlementStatus,
  ProductKey,
} from "@/types/entitlement";

/**
 * Hand-written Supabase schema types for the three paid-foundation tables. The shape
 * follows the `Database` layout the Supabase CLI generates (`supabase gen types
 * typescript`), so a CLI-generated file can replace this one later without touching any
 * call sites — only the tables this app actually reads/writes are declared.
 *
 * Everything here is a `type` (not `interface`) on purpose: supabase-js constrains
 * rows to `Record<string, unknown>`, which interfaces do not satisfy (no implicit
 * index signature) — using interfaces silently collapses all query results to `never`.
 */

export type UserProfileRow = {
  user_id: string;
  locale: string;
  created_at: string;
  updated_at: string;
};

export type UserProgressRow = {
  user_id: string;
  progress: AppProgress;
  schema_version: number;
  revision: number;
  created_at: string;
  updated_at: string;
};

export type UserEntitlementRow = {
  id: string;
  user_id: string;
  product_key: ProductKey;
  status: EntitlementStatus;
  source: EntitlementSource;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
};

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRow;
        Insert: {
          user_id: string;
          locale?: string;
        };
        Update: {
          locale?: string;
        };
        Relationships: [];
      };
      user_progress: {
        Row: UserProgressRow;
        Insert: {
          user_id: string;
          progress: AppProgress;
          schema_version?: number;
          revision?: number;
        };
        Update: {
          progress?: AppProgress;
          schema_version?: number;
          revision?: number;
        };
        Relationships: [];
      };
      user_entitlements: {
        // Clients can only SELECT this table (RLS); Insert/Update stay `never` on
        // purpose so a client-side write attempt is already a type error.
        Row: UserEntitlementRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_user_progress: {
        Args: {
          p_progress: AppProgress;
          p_expected_revision: number;
          p_schema_version: number;
        };
        Returns: {
          saved: boolean;
          revision: number;
          progress: AppProgress;
          schema_version: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

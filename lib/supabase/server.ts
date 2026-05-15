import {
  createServerClient,
  type SetAllCookies
} from "@supabase/ssr";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    serverEnv.supabaseUrl,
    serverEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Em Server Components o Next pode bloquear escrita em cookies.
          }
        }
      }
    }
  );
}

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// Browser-side client (used for avatar uploads). It shares the session
// cookies set by the server, so uploads are made as the signed-in user.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}

import { createClient } from "@supabase/supabase-js";

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const NEXT_PUBLIC_SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY as string;

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY);



import { createClient } from '@supabase/supabase-js'

// Client for server-side (admin) operations. Requires SUPABASE_SERVICE_ROLE_KEY — keep this secret.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Client safe for browser / public usage (uses anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

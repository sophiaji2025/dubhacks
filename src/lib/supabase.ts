import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let publicClient: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null

function configuredValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) throw new Error('Supabase is not configured')
  return trimmed
}

export function getSupabase(): SupabaseClient {
  if (!publicClient) {
    publicClient = createClient(
      configuredValue(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      configuredValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
    )
  }
  return publicClient
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      configuredValue(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      configuredValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
    )
  }
  return adminClient
}

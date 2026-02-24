import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jqaffigxzprtorxlgyvt.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Prevent "supabaseKey is required" crash by providing a placeholder if missing
// Actual operations will still fail, which we handle in the UI and actions
export const supabase = createClient(supabaseUrl, supabaseKey || 'placeholder-key-missing')

if (!supabaseKey && typeof window === 'undefined') {
    console.warn("⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables.")
}

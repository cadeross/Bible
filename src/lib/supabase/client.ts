import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        console.warn("Supabase keys missing. Auth and Sync features will not work.")
        // Return a dummy object or handle this better in usage? 
        // For now, let's return null and let callers handle it, or return a broken client?
        // Safer to return a dummy client that logs errors on calls to avoid sporadic crashes?
        // Actually, createBrowserClient might not throw if we pass empty strings, but calls will fail.
        return createBrowserClient(url || 'https://placeholder.supabase.co', key || 'placeholder')
    }

    return createBrowserClient(url, key)
}


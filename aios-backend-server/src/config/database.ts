import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'
import { env } from './env'

// Debug: Check if env variables are loaded
console.log('Supabase URL:', process.env.SUPABASE_URL?.substring(0, 10) + '...');
console.log('Supabase Key exists:', !!process.env.SUPABASE_ANON_KEY);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient<Database>(
  env.supabase.url,
  env.supabase.anonKey
)

// Create admin client with service role key
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Common database queries
export const db = {
  users: {
    findById: (id: string) => 
      supabase.from('users').select('*').eq('id', id).single(),
    findByEmail: (email: string) =>
      supabase.from('users').select('*').eq('email', email).single(),
  },
  apiKeys: {
    findByUserId: (userId: string) =>
      supabase.from('api_keys').select('*').eq('user_id', userId),
  },
  pointTransactions: {
    findByUserId: (userId: string) =>
      supabase.from('point_transactions').select('*').eq('user_id', userId),
  },
  subscriptions: {
    findByUserId: (userId: string) =>
      supabase.from('subscriptions').select('*').eq('user_id', userId),
  }
}

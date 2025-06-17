// supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl: string = 'https://btrmwwffuathoenxhqus.supabase.co'
const supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cm13d2ZmdWF0aG9lbnhocXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTAxMzMsImV4cCI6MjA2NTU2NjEzM30.iQPzt2in3PUA26-AvoqoXCZJ38inwPHtqjAuLO09vlM'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ghwozyzlhcmuhneumasv.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdod296eXpsaGNtdWhuZXVtYXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzgyNjUsImV4cCI6MjA5NTExNDI2NX0.S5746-2ilKhwRApSk-q0ZAMSsX6STx_-Bc6CVLKPdAM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export function db() {
  return supabase
}
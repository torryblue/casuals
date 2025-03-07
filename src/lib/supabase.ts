
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwnpdvsdsirpqgyvmglv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bnBkdnNkc2lycHFneXZtZ2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMzU5OTQsImV4cCI6MjA1NjkxMTk5NH0._XRBaHerDAtPQPPgqMX3l-oh5Ck0G_WtBSa7rgnqGDM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwnpdvsdsirpqgyvmglv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bnBkdnNkc2lycHFneXZtZ2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMzU5OTQsImV4cCI6MjA1NjkxMTk5NH0._XRBaHerDAtPQPPgqMX3l-oh5Ck0G_WtBSa7rgnqGDM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is reachable
export const checkSupabaseConnection = async () => {
  try {
    // Try a simple query to check connection
    const { error } = await supabase.from('employees').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      
      // Additional diagnostic information
      if (error.code === 'PGRST204') {
        console.warn('Table or column might not exist. Please check your database schema.');
      }
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
};

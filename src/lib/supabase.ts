import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwnpdvsdsirpqgyvmglv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bnBkdnNkc2lycHFneXZtZ2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMzU5OTQsImV4cCI6MjA1NjkxMTk5NH0._XRBaHerDAtPQPPgqMX3l-oh5Ck0G_WtBSa7rgnqGDM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is reachable
export const checkSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Check if employees table exists
    const { error: employeesError } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true });
    
    if (employeesError) {
      console.error('Employees table check failed:', employeesError);
      if (employeesError.code === 'PGRST204') {
        console.warn('Employees table might not exist. Please check your database schema.');
      }
    } else {
      console.log('Employees table check: OK');
    }
    
    // Check if schedules table exists
    const { error: schedulesError } = await supabase
      .from('schedules')
      .select('count', { count: 'exact', head: true });
      
    if (schedulesError) {
      console.error('Schedules table check failed:', schedulesError);
      if (schedulesError.code === 'PGRST204') {
        console.warn('Schedules table might not exist. Please check your database schema.');
      }
    } else {
      console.log('Schedules table check: OK');
    }
    
    // Check if work_entries table exists and check column names
    const { error: entriesError } = await supabase
      .from('work_entries')
      .select('count', { count: 'exact', head: true });
      
    if (entriesError) {
      console.error('Work entries table check failed:', entriesError);
      if (entriesError.code === 'PGRST204') {
        console.warn('Work entries table might not exist. Please check your database schema.');
      }
    } else {
      console.log('Work entries table check: OK');
      
      // Log column structure for debugging
      try {
        const { data: columnInfo, error: columnError } = await supabase.rpc('get_column_names', { 
          table_name: 'work_entries' 
        });
        
        if (columnError) {
          console.error('Failed to get column info:', columnError);
        } else {
          console.log('Work entries columns:', columnInfo);
        }
      } catch (e) {
        console.log('Could not fetch column info (requires create_column_info_function.sql to be run)');
      }
    }
    
    // If any table check failed, return false
    if (employeesError || schedulesError || entriesError) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
};

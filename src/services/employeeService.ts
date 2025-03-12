import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { Employee } from '@/contexts/EmployeeContext';

// Generate a unique ID for new employees
export const generateEmployeeId = (): string => {
  return `EMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

// Fetch all employees from the database
export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    console.log('Fetching employees from Supabase');
    const { data, error } = await supabase
      .from('employees')
      .select('*');
    
    if (error) {
      console.error('Supabase error fetching employees:', error);
      throw error;
    }
    
    if (data) {
      console.log('Fetched employees:', data);
      return data as Employee[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    toast.error('Failed to fetch employees. Please refresh the page.');
    return [];
  }
};

// Add a new employee to the database
export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<{ success: boolean; employee?: Employee }> => {
  try {
    const newEmployee = {
      id: generateEmployeeId(),
      ...employee
    };
    
    console.log('Adding employee with data:', newEmployee);
    
    // Explicitly log the structure of the insert operation
    console.log('Inserting into employees table with data structure:', JSON.stringify(newEmployee, null, 2));
    
    // Check if Supabase client is initialized
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return { success: false };
    }
    
    // Insert the employee directly, no need to rename fields since they should already match
    const { error, data } = await supabase
      .from('employees')
      .insert([newEmployee])
      .select();
    
    if (error) {
      console.error('Supabase error adding employee:', error);
      throw error;
    }
    
    console.log('Employee added successfully, response data:', data);
    return { success: true, employee: newEmployee };
  } catch (error: any) {
    console.error('Error adding employee:', error);
    
    let errorMessage = 'Unknown error';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.details) {
      errorMessage = error.details;
    }
    
    toast.error(`Failed to add employee: ${errorMessage}`);
    return { success: false };
  }
};

// Update an existing employee
export const updateEmployee = async (id: string, updatedData: Omit<Employee, 'id'>): Promise<boolean> => {
  try {
    console.log('Updating employee with ID:', id, 'Data:', updatedData);
    
    const { error } = await supabase
      .from('employees')
      .update(updatedData)
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error updating employee:', error);
      throw error;
    }
    
    console.log('Employee updated successfully');
    toast.success('Employee updated successfully');
    return true;
  } catch (error: any) {
    console.error('Error updating employee:', error);
    toast.error(`Failed to update employee: ${error.message || 'Unknown error'}`);
    return false;
  }
};

// Delete an employee
export const removeEmployee = async (id: string): Promise<boolean> => {
  try {
    console.log('Removing employee with ID:', id);
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error removing employee:', error);
      throw error;
    }
    
    console.log('Employee removed successfully');
    toast.success('Employee removed successfully');
    return true;
  } catch (error: any) {
    console.error('Error removing employee:', error);
    toast.error(`Failed to remove employee: ${error.message || 'Unknown error'}`);
    return false;
  }
};

// Add a new function to get employee by ID
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    console.log('Fetching employee with ID:', id);
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error fetching employee:', error);
      throw error;
    }
    
    if (data) {
      console.log('Fetched employee:', data);
      return data as Employee;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching employee:', error);
    toast.error('Failed to fetch employee details');
    return null;
  }
};

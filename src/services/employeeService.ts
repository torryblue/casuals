
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { Employee, NewEmployee } from '@/types/employee';

// Generate a unique ID for new employees
export const generateEmployeeId = (): string => {
  return `EMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

// Fetch all employees from the database
export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*');
    
    if (error) {
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
export const addEmployee = async (employee: NewEmployee): Promise<{ success: boolean; employee?: Employee }> => {
  try {
    const newEmployee = {
      id: generateEmployeeId(),
      ...employee
    };
    
    console.log('Adding employee with data:', newEmployee);
    
    // Explicitly log the structure of the insert operation
    console.log('Inserting into employees table with data structure:', JSON.stringify(newEmployee, null, 2));
    
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
    
    return { success: false };
  }
};

// Update an existing employee
export const updateEmployee = async (id: string, updatedData: NewEmployee): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('employees')
      .update(updatedData)
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return false;
  }
};

// Delete an employee
export const removeEmployee = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error removing employee:', error);
    return false;
  }
};

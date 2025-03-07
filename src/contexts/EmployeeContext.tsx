import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { supabase, checkSupabaseConnection } from '@/lib/supabase';

export type Employee = {
  id: string;
  name: string;
  surname: string;
  idNo: string;  // Changed back to camelCase to match Supabase schema
  contact: string;
  address: string;
  gender: string;
  nextOfKinName: string;  // Changed back to camelCase to match Supabase schema
  nextOfKinContact: string;  // Changed back to camelCase to match Supabase schema
};

type EmployeeContextType = {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<boolean>;
  updateEmployee: (id: string, updatedData: Omit<Employee, 'id'>) => void;
  removeEmployee: (id: string) => void;
  isLoading: boolean;
};

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionChecked, setConnectionChecked] = useState(false);

  useEffect(() => {
    const initSupabase = async () => {
      const isConnected = await checkSupabaseConnection();
      setConnectionChecked(true);
      
      if (isConnected) {
        fetchEmployees();
      } else {
        toast.error('Unable to connect to the database. Please check your internet connection and try again.');
      }
    };
    
    initSupabase();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('Fetched employees:', data);
        setEmployees(data as Employee[]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateId = () => {
    return `EMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  };

  const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<boolean> => {
    setIsLoading(true);
    
    const newEmployee = {
      id: generateId(),
      ...employee
    };
    
    try {
      console.log('Adding employee with data:', newEmployee);
      
      const { error, data } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select();
      
      if (error) {
        console.error('Supabase error adding employee:', error);
        throw error;
      }
      
      console.log('Employee added successfully:', data);
      setEmployees(prev => [...prev, newEmployee]);
      toast.success("Employee created successfully");
      return true;
    } catch (error: any) {
      console.error('Error adding employee:', error);
      
      let errorMessage = 'Unknown error';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }
      
      toast.error(`Failed to create employee: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmployee = async (id: string, updatedData: Omit<Employee, 'id'>) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('employees')
        .update(updatedData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setEmployees(prev => 
        prev.map(employee => 
          employee.id === id 
            ? { ...updatedData, id } 
            : employee
        )
      );
      
      toast.success("Employee updated successfully");
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(`Failed to update employee: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeEmployee = async (id: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setEmployees(prev => prev.filter(employee => employee.id !== id));
      toast.success("Employee removed successfully");
    } catch (error: any) {
      console.error('Error removing employee:', error);
      toast.error(`Failed to remove employee: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EmployeeContext.Provider value={{ 
      employees, 
      addEmployee, 
      updateEmployee,
      removeEmployee,
      isLoading 
    }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};

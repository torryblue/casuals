
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { supabase, checkSupabaseConnection } from '@/lib/supabase';

export type Employee = {
  id: string;
  name: string;
  surname: string;
  id_no: string;  // Changed from idNo to id_no to match Supabase schema
  contact: string;
  address: string;
  gender: string;
  next_of_kin_name: string;  // Changed from nextOfKinName to next_of_kin_name
  next_of_kin_contact: string;  // Changed from nextOfKinContact to next_of_kin_contact
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
    // Check connection and fetch employees when component mounts
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
        // Map the database column names to our frontend property names
        const mappedEmployees = data.map(emp => ({
          id: emp.id,
          name: emp.name,
          surname: emp.surname,
          id_no: emp.id_no,
          contact: emp.contact,
          address: emp.address,
          gender: emp.gender,
          next_of_kin_name: emp.next_of_kin_name,
          next_of_kin_contact: emp.next_of_kin_contact
        }));
        setEmployees(mappedEmployees as Employee[]);
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
    
    // Format the employee data to match the database column names
    const newEmployee = {
      id: generateId(),
      name: employee.name,
      surname: employee.surname,
      id_no: employee.id_no,
      contact: employee.contact,
      address: employee.address,
      gender: employee.gender,
      next_of_kin_name: employee.next_of_kin_name,
      next_of_kin_contact: employee.next_of_kin_contact
    };
    
    try {
      console.log('Adding employee with formatted data:', newEmployee);
      
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
      
      // More detailed error message
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
      // Format the employee data to match the database column names
      const formattedData = {
        name: updatedData.name,
        surname: updatedData.surname,
        id_no: updatedData.id_no,
        contact: updatedData.contact,
        address: updatedData.address,
        gender: updatedData.gender,
        next_of_kin_name: updatedData.next_of_kin_name,
        next_of_kin_contact: updatedData.next_of_kin_contact
      };
      
      const { error } = await supabase
        .from('employees')
        .update(formattedData)
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

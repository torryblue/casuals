
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';

export type Employee = {
  id: string;
  name: string;
  surname: string;
  idNo: string;
  contact: string;
  address: string;
  gender: string;
  nextOfKinName: string;
  nextOfKinContact: string;
};

type EmployeeContextType = {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updatedData: Omit<Employee, 'id'>) => void;
  removeEmployee: (id: string) => void;
  isLoading: boolean;
};

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch employees from Supabase when component mounts
    fetchEmployees();
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
        setEmployees(data as Employee[]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  const generateId = () => {
    return `EMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  };

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    setIsLoading(true);
    
    const newEmployee = {
      ...employee,
      id: generateId()
    };
    
    try {
      const { error } = await supabase
        .from('employees')
        .insert([newEmployee]);
      
      if (error) {
        throw error;
      }
      
      setEmployees(prev => [...prev, newEmployee]);
      toast.success("Employee created successfully");
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to create employee');
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
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
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
    } catch (error) {
      console.error('Error removing employee:', error);
      toast.error('Failed to remove employee');
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

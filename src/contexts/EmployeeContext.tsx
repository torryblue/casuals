
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";
import { checkSupabaseConnection } from '@/lib/supabase';
import { Employee, EmployeeContextType, NewEmployee } from '@/types/employee';
import * as employeeService from '@/services/employeeService';

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
    const data = await employeeService.fetchEmployees();
    setEmployees(data);
    setIsLoading(false);
  };

  const addEmployee = async (employee: NewEmployee): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { success, employee: newEmployee } = await employeeService.addEmployee(employee);
      
      if (success && newEmployee) {
        setEmployees(prev => [...prev, newEmployee]);
        toast.success("Employee created successfully");
        return true;
      } else {
        toast.error(`Failed to create employee`);
        return false;
      }
    } catch (error: any) {
      console.error('Error in addEmployee:', error);
      toast.error(`Failed to create employee: ${error.message || 'Unknown error'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmployee = async (id: string, updatedData: NewEmployee) => {
    setIsLoading(true);
    
    try {
      const success = await employeeService.updateEmployee(id, updatedData);
      
      if (success) {
        setEmployees(prev => 
          prev.map(employee => 
            employee.id === id 
              ? { ...updatedData, id } 
              : employee
          )
        );
        
        toast.success("Employee updated successfully");
      } else {
        toast.error("Failed to update employee");
      }
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
      const success = await employeeService.removeEmployee(id);
      
      if (success) {
        setEmployees(prev => prev.filter(employee => employee.id !== id));
        toast.success("Employee removed successfully");
      } else {
        toast.error("Failed to remove employee");
      }
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

export type { Employee } from '@/types/employee';

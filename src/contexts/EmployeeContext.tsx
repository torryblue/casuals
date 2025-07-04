import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { addEmployee as addEmployeeService, fetchEmployees, updateEmployee as updateEmployeeService, removeEmployee as removeEmployeeService } from '@/services/employeeService';

export type Employee = {
  id: string;
  name: string | null;  // nullable as per DB schema
  surname: string | null; // nullable as per DB schema
  idno: string | null; // nullable as per DB schema
  contact: string | null; // nullable as per DB schema
  address: string | null; // nullable as per DB schema
  gender: string | null; // nullable as per DB schema
  nextofkinname: string | null; // nullable as per DB schema
  nextofkincontact: string | null; // nullable as per DB schema
};

type EmployeeContextType = {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, updatedData: Omit<Employee, 'id'>) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
  isLoading: boolean;
};

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch employees when component mounts
  useEffect(() => {
    const getEmployees = async () => {
      setIsLoading(true);
      try {
        const employeeData = await fetchEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getEmployees();
  }, []);

  // Generate a unique worker ID with prefix WRK
  const generateWorkerId = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `WRK-${timestamp}-${random}`;
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    setIsLoading(true);
    try {
      console.log("Adding employee with data:", employeeData);
      
      const newEmployee = {
        ...employeeData,
        id: generateWorkerId(),
      };

      const result = await addEmployeeService(employeeData as any);
      
      if (result.success) {
        setEmployees(prev => [...prev, result.employee as Employee]);
        toast.success(`Employee ${employeeData.name} ${employeeData.surname} created successfully`);
      } else {
        throw new Error("Failed to add employee");
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error(`Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmployee = async (id: string, updatedData: Omit<Employee, 'id'>) => {
    setIsLoading(true);
    try {
      console.log("Updating employee with ID:", id, "Data:", updatedData);
      
      const success = await updateEmployeeService(id, updatedData);
      
      if (success) {
        // Update the local state
        setEmployees(prev => 
          prev.map(emp => emp.id === id ? { ...emp, ...updatedData, id } : emp)
        );
        toast.success(`Employee ${updatedData.name} ${updatedData.surname} updated successfully`);
      } else {
        throw new Error("Failed to update employee");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error(`Failed to update employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeEmployee = async (id: string) => {
    setIsLoading(true);
    try {
      console.log("Removing employee with ID:", id);
      
      const success = await removeEmployeeService(id);
      
      if (success) {
        // Remove from local state
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        toast.success("Employee removed successfully");
      } else {
        throw new Error("Failed to remove employee");
      }
    } catch (error) {
      console.error("Error removing employee:", error);
      toast.error(`Failed to remove employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
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

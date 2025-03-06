
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from "sonner";

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

  const generateId = () => {
    return `EMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const newEmployee = {
        ...employee,
        id: generateId()
      };
      
      setEmployees(prev => [...prev, newEmployee]);
      setIsLoading(false);
      toast.success("Employee created successfully");
    }, 1000);
  };

  const updateEmployee = (id: string, updatedData: Omit<Employee, 'id'>) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setEmployees(prev => 
        prev.map(employee => 
          employee.id === id 
            ? { ...updatedData, id } 
            : employee
        )
      );
      
      setIsLoading(false);
      toast.success("Employee updated successfully");
    }, 1000);
  };

  const removeEmployee = (id: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setEmployees(prev => prev.filter(employee => employee.id !== id));
      setIsLoading(false);
      toast.success("Employee removed successfully");
    }, 1000);
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

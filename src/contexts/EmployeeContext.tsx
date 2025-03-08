import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from "sonner";

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
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  isLoading: boolean;
};

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate a unique worker ID with prefix WRK
  const generateWorkerId = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `WRK-${timestamp}-${random}`;
  };

  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newEmployee = {
        ...employeeData,
        id: generateWorkerId(),
      };

      setEmployees(prev => [...prev, newEmployee]);
      setIsLoading(false);
      toast.success(`Employee ${employeeData.name} ${employeeData.surname} created successfully`);
    }, 1000);
  };

  return (
    <EmployeeContext.Provider value={{
      employees,
      addEmployee,
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

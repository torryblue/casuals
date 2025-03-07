
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

export type NewEmployee = Omit<Employee, 'id'>;

export type EmployeeContextType = {
  employees: Employee[];
  addEmployee: (employee: NewEmployee) => Promise<boolean>;
  updateEmployee: (id: string, updatedData: NewEmployee) => void;
  removeEmployee: (id: string) => void;
  isLoading: boolean;
};

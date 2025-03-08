
export type Employee = {
  id: string;
  name: string | null;
  surname: string | null;
  idno: string | null;  
  contact: string | null;
  address: string | null;
  gender: string | null;
  nextofkinname: string | null;
  nextofkincontact: string | null;
};

export type NewEmployee = Omit<Employee, 'id'>;

export type EmployeeContextType = {
  employees: Employee[];
  addEmployee: (employee: NewEmployee) => Promise<boolean>;
  updateEmployee: (id: string, updatedData: NewEmployee) => void;
  removeEmployee: (id: string) => void;
  isLoading: boolean;
};

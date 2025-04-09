
import { useState, useEffect } from "react";
import { Search, UserPlus, UserX } from "lucide-react";
import { useEmployees } from "@/contexts/EmployeeContext";
import { Employee } from "@/contexts/EmployeeContext";

interface EmployeeSearchProps {
  selectedEmployees: string[];
  onEmployeeSelect: (employeeId: string, isSelected: boolean) => void;
  isEmployeeDisabled?: (employeeId: string) => boolean;
  maxHeight?: string;
}

const EmployeeSearch = ({ 
  selectedEmployees, 
  onEmployeeSelect, 
  isEmployeeDisabled = () => false,
  maxHeight = "max-h-60" 
}: EmployeeSearchProps) => {
  const { employees } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = employees.filter(
        employee =>
          (employee.name?.toLowerCase().includes(lowerCaseSearch) || false) ||
          (employee.surname?.toLowerCase().includes(lowerCaseSearch) || false) ||
          (employee.id.toLowerCase().includes(lowerCaseSearch))
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  return (
    <div className="space-y-2">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="input-field pl-10 w-full"
          placeholder="Search employees by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {selectedEmployees.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">Selected ({selectedEmployees.length}):</p>
          <div className="flex flex-wrap gap-1">
            {selectedEmployees.map((empId) => {
              const emp = employees.find(e => e.id === empId);
              return (
                <span 
                  key={empId} 
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                >
                  {emp ? `${emp.name} ${emp.surname}` : empId}
                  <button 
                    type="button" 
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    onClick={() => onEmployeeSelect(empId, false)}
                  >
                    <UserX className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
      
      <div className={`${maxHeight} overflow-y-auto border border-gray-200 rounded-md`}>
        {filteredEmployees.length > 0 ? (
          <div className="space-y-1 p-1">
            {filteredEmployees.map((employee) => {
              const isSelected = selectedEmployees.includes(employee.id);
              const isDisabled = isEmployeeDisabled(employee.id);
              
              return (
                <div 
                  key={employee.id} 
                  className={`flex items-center justify-between p-2 rounded-md ${
                    isSelected ? 'bg-blue-50' : 
                    isDisabled ? 'bg-gray-100 opacity-60' : 
                    'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {employee.name} {employee.surname}
                    </p>
                    <p className="text-xs text-gray-500">{employee.id}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onEmployeeSelect(employee.id, !isSelected)}
                    className={`p-1 rounded-full ${
                      isSelected 
                        ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-100' 
                        : isDisabled
                          ? 'cursor-not-allowed text-gray-400'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title={isDisabled ? "Already assigned to another duty on this date" : ""}
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No employees found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSearch;
